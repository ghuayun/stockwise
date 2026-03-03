import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stockAnalyzer } from "./services/stockAnalyzer";
import { stockDiscovery } from "./services/stockDiscovery";
import { yahooFinanceService } from "./services/yahooFinance";
import { 
  insertStockAnalysisSchema, 
  insertUpcomingIPOSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get market data for major indices
  app.get("/api/market-data", async (req, res) => {
    try {
      const symbols = ["^GSPC", "^DJI", "^IXIC", "QQQ"]; // S&P 500, DOW, NASDAQ, QQQ
      const quotes = await Promise.all(
        symbols.map(symbol => yahooFinanceService.getStockQuote(symbol))
      );

      const marketData = quotes.map((quote, index) => {
        if (!quote) return null;
        const labels = ["S&P 500", "DOW", "NASDAQ", "QQQ"];
        return {
          label: labels[index],
          symbol: quote.symbol,
          value: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
        };
      }).filter(data => data !== null);

      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Get all stock recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const sectorParam = (req.query.sector as string | undefined)?.trim();
      let recommendations;
      if (sectorParam) {
        // Normalize sector variants: allow 'tech', 'technology', 'information technology'
        const normalized = sectorParam.toLowerCase();
        let sectorValue: string | undefined;
        if (["tech", "technology", "information technology", "it"].includes(normalized)) {
          sectorValue = "Technology"; // Yahoo Finance common sector label
        } else {
          // Capitalize first letter of each word for consistency with stored values
          sectorValue = normalized.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
        recommendations = await storage.getStockRecommendationsBySector(sectorValue);
      } else {
        recommendations = await storage.getAllStockRecommendations();
      }
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Get historical recommendations grouped by date
  app.get("/api/recommendations/historical", async (req, res) => {
    try {
      const historicalData = await storage.getHistoricalRecommendationsByDate();
      
      // Format the response and fetch current prices
      const formattedData = await Promise.all(historicalData.map(async ({ date, recommendations }) => {
        const stocksWithCurrentPrices = await Promise.all(recommendations.map(async rec => {
          let currentPrice = rec.recommendedPrice;
          try {
            // Fetch current price from Yahoo Finance
            const quote = await yahooFinanceService.getStockQuote(rec.ticker);
            currentPrice = quote?.regularMarketPrice || rec.recommendedPrice;
          } catch (error) {
            console.warn(`Could not fetch current price for ${rec.ticker}, using recommended price`);
          }
          
          return {
            ticker: rec.ticker,
            companyName: rec.companyName,
            recommendedPrice: rec.recommendedPrice,
            currentPrice,
            performance: ((currentPrice - rec.recommendedPrice) / rec.recommendedPrice * 100),
            signal: rec.signal,
          };
        }));
        
        return {
          date: new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          stocks: stocksWithCurrentPrices
        };
      }));
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching historical recommendations:", error);
      res.status(500).json({ message: "Failed to fetch historical recommendations" });
    }
  });

  // Get recommendations by market cap category
  app.get("/api/recommendations/:category", async (req, res) => {
    try {
      const { category } = req.params;
      if (!["large", "mid", "small"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      const recommendations = await storage.getStockRecommendationsByCategory(category);
      res.json(recommendations);
    } catch (error) {
      console.error(`Error fetching ${req.params.category} recommendations:`, error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Analyze custom stock
  app.post("/api/analyze", async (req, res) => {
    try {
      const { ticker } = req.body;
      
      if (!ticker || typeof ticker !== "string") {
        return res.status(400).json({ message: "Ticker is required" });
      }

      const upperTicker = ticker.toUpperCase();
      
      const existing = await storage.getStockAnalysisByTicker(upperTicker);
      if (existing) {
        const ageMinutes = (Date.now() - new Date(existing.analyzedAt).getTime()) / 1000 / 60;
        if (ageMinutes < 30) {
          return res.json(existing);
        }
      }

      const result = await stockAnalyzer.analyzeCustomStock(upperTicker);
      
      if (!result) {
        return res.status(404).json({ message: "Stock not found or analysis failed" });
      }

      const validatedAnalysis = insertStockAnalysisSchema.parse(result.analysis);
      const savedAnalysis = await storage.createStockAnalysis(validatedAnalysis);
      
      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error analyzing stock:", error);
      res.status(500).json({ message: "Failed to analyze stock" });
    }
  });

  // Get recent custom analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getRecentStockAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Get upcoming IPOs
  app.get("/api/ipos", async (req, res) => {
    try {
      const ipos = await storage.getAllUpcomingIPOs();
      res.json(ipos);
    } catch (error) {
      console.error("Error fetching IPOs:", error);
      res.status(500).json({ message: "Failed to fetch IPOs" });
    }
  });

  // Add upcoming IPO (admin route)
  app.post("/api/ipos", async (req, res) => {
    try {
      const validatedIPO = insertUpcomingIPOSchema.parse(req.body);
      const ipo = await storage.createUpcomingIPO(validatedIPO);
      res.json(ipo);
    } catch (error) {
      console.error("Error creating IPO:", error);
      res.status(500).json({ message: "Failed to create IPO" });
    }
  });

  // Get detailed IPO information
  app.get("/api/ipos/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const ipo = await storage.getUpcomingIPOByTicker(ticker);
      
      if (!ipo) {
        return res.status(404).json({ message: "IPO not found" });
      }

      // Fetch company profile from Yahoo Finance (if ticker is available)
      let businessSummary = ipo.description;
      let website = '';
      let industry = '';
      let sectorDetail = ipo.sector;
      
      if (ticker && ticker !== 'TBD') {
        try {
          const { getCompanyProfile } = await import("./services/yahooFinance");
          const profile = await getCompanyProfile(ticker);
          if (profile && profile.businessSummary) {
            businessSummary = profile.businessSummary;
            website = profile.website || '';
            industry = profile.industry || '';
            sectorDetail = profile.sector || ipo.sector;
          }
        } catch (error) {
          console.log(`Could not fetch company profile for ${ticker}, using default description`);
        }
      }

      // Fetch news about the company
      const { getCompanyNews } = await import("./services/newsService");
      const news = await getCompanyNews(ipo.companyName, 5);

      // Generate AI analysis using Groq
      const { analyzeIPO } = await import("./services/groqService");
      const analysis = await analyzeIPO(
        ipo.companyName,
        ipo.ticker,
        sectorDetail,
        ipo.expectedValuation,
        ipo.priceRange,
        ipo.ipoDate,
        news
      );

      res.json({
        ...ipo,
        description: businessSummary,
        sector: sectorDetail,
        website,
        industry,
        news,
        analysis,
      });
    } catch (error) {
      console.error("Error fetching IPO details:", error);
      res.status(500).json({ 
        message: "Failed to fetch IPO details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Refresh IPO data from Finnhub
  app.post("/api/ipos/refresh", async (req, res) => {
    try {
      console.log("Refreshing IPO data from Finnhub...");
      const { ipoService } = await import("./services/ipoService");
      
      // Fetch fresh IPO data
      const ipos = await ipoService.fetchUpcomingIPOs();
      console.log(`Fetched ${ipos.length} IPOs from service`);
      
      if (ipos.length === 0) {
        console.log("No IPOs fetched, using existing data");
        return res.status(500).json({ 
          message: "Failed to fetch IPO data. Using existing data." 
        });
      }
      
      // Clear existing IPOs
      console.log("Clearing existing IPOs...");
      await storage.deleteAllUpcomingIPOs();
      
      // Insert new IPOs
      console.log("Inserting new IPOs...");
      for (const ipo of ipos) {
        await storage.createUpcomingIPO(ipo);
      }
      
      console.log(`Successfully refreshed ${ipos.length} upcoming IPOs`);
      res.json({ 
        message: `Successfully refreshed ${ipos.length} upcoming IPOs`,
        count: ipos.length 
      });
    } catch (error) {
      console.error("Error refreshing IPOs:", error);
      res.status(500).json({ 
        message: "Failed to refresh IPOs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Manual refresh of recommendations
  app.post("/api/refresh", async (req, res) => {
    try {
      console.log("Fetching stock recommendations from ML backend...");
      
      // Define the 5 sectors we want recommendations for
      const sectors = [
        "Technology",
        "Healthcare", 
        "Financial Services",
        "Consumer Cyclical",
        "Energy"
      ];
      
      // Get configuration: 5 stocks per sector per market cap category
      const stocksPerSector = 5;
      
      console.log(`Requesting ${stocksPerSector} stocks per sector for ${sectors.length} sectors across 3 market cap categories`);
      console.log(`Expected total: ${stocksPerSector * sectors.length * 3} = 75 recommendations`);
      
      let allCandidates: any[] = [];
      let mlBackendAvailable = true;
      
      // Try to fetch from ML backend for each sector
      for (const sector of sectors) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/candidates?limit=200&timeframe=1m&min_score=0&large_cap_count=${stocksPerSector}&mid_cap_count=${stocksPerSector}&small_cap_count=${stocksPerSector}&sector=${encodeURIComponent(sector)}`
          );
          
          if (!response.ok) {
            console.warn(`ML backend returned ${response.status} for sector ${sector}`);
            mlBackendAvailable = false;
            break;
          }
          
          const data = await response.json();
          const largeCaps = (data.large_caps || []).map((c: any) => ({ ...c, market_cap_category: 'large', sector }));
          const midCaps = (data.mid_caps || []).map((c: any) => ({ ...c, market_cap_category: 'mid', sector }));
          const smallCaps = (data.small_caps || []).map((c: any) => ({ ...c, market_cap_category: 'small', sector }));
          
          console.log(`Sector ${sector}: ${largeCaps.length} large, ${midCaps.length} mid, ${smallCaps.length} small caps`);
          
          allCandidates.push(...largeCaps, ...midCaps, ...smallCaps);
        } catch (error) {
          console.error(`Error fetching sector ${sector} from ML backend:`, error);
          mlBackendAvailable = false;
          break;
        }
      }
      
      // Fallback to original discovery method if ML backend fails
      if (!mlBackendAvailable || allCandidates.length === 0) {
        console.log("ML backend unavailable or returned no data, falling back to dynamic discovery");
        
        const config = {
          largeCaps: parseInt(process.env.LARGE_CAP_COUNT || "5"),
          midCaps: parseInt(process.env.MID_CAP_COUNT || "5"),
          smallCaps: parseInt(process.env.SMALL_CAP_COUNT || "5"),
        };
        
        const useDynamicDiscovery = process.env.USE_DYNAMIC_DISCOVERY === "true";

        let stocks;
        if (useDynamicDiscovery) {
          console.log("Using dynamic stock discovery...");
          stocks = await stockDiscovery.discoverStocks(config);
        } else {
          console.log("Using curated stock list...");
          stocks = stockDiscovery.getCuratedStocks(config);
        }
        
        const allTickers = stocks.allTickers;
        console.log(`Analyzing ${allTickers.length} stocks:`, allTickers.join(", "));
        
        // Save current recommendations as historical snapshot before deleting
        console.log("Saving current recommendations as historical snapshot...");
        await storage.saveCurrentRecommendationsAsHistorical();
        
        await storage.deleteAllStockRecommendations();
        
        // Return immediately
        res.json({ 
          message: "Recommendations refresh started in background (fallback method)", 
          count: allTickers.length 
        });

        // Process in background
        (async () => {
          try {
            console.log(`Starting background fallback analysis of ${allTickers.length} stocks...`);
            const analyzed = await stockAnalyzer.batchAnalyzeStocksAsync(
              allTickers,
              (completed, total) => {
                console.log(`Fallback analysis progress: ${completed}/${total}`);
              }
            );
            
            console.log(`Saving ${analyzed.length} analyzed stocks to database...`);
            for (const { recommendation } of analyzed) {
              await storage.createStockRecommendation(recommendation);
            }
            
            await storage.createRefreshLog({
              refreshType: "recommendations",
              status: "success",
              message: `Refreshed ${analyzed.length} stock recommendations (fallback method, async)`,
            });
            
            console.log(`✓ Background fallback refresh completed: ${analyzed.length} recommendations saved`);
          } catch (error) {
            console.error("Error in background fallback refresh:", error);
            await storage.createRefreshLog({
              refreshType: "recommendations",
              status: "error",
              message: `Fallback refresh failed: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        })();
        
        return; // Exit early since we already sent response
      }
      
      // Use ML backend candidates (sector-categorized)
      console.log(`Received ${allCandidates.length} total candidates from ML backend`);
      
      // Log breakdown by sector and market cap
      for (const sector of sectors) {
        const sectorCandidates = allCandidates.filter(c => c.sector === sector);
        const largeCaps = sectorCandidates.filter(c => c.market_cap_category === 'large');
        const midCaps = sectorCandidates.filter(c => c.market_cap_category === 'mid');
        const smallCaps = sectorCandidates.filter(c => c.market_cap_category === 'small');
        console.log(`  ${sector}: ${largeCaps.length}L/${midCaps.length}M/${smallCaps.length}S`);
      }
      
      const tickersToAnalyze = allCandidates.map((c: any) => c.ticker);
      console.log(`Analyzing ${tickersToAnalyze.length} total stocks`);
      
      // Save current recommendations as historical snapshot before deleting
      console.log("Saving current recommendations as historical snapshot...");
      await storage.saveCurrentRecommendationsAsHistorical();
      
      await storage.deleteAllStockRecommendations();
      
      // Return immediately with a success response
      res.json({ 
        message: "Recommendations refresh started in background", 
        count: tickersToAnalyze.length,
        note: "Analysis is being processed asynchronously"
      });

      // Process analysis in the background (don't await)
      (async () => {
        try {
          console.log(`Starting background analysis of ${tickersToAnalyze.length} stocks...`);
          const analyzed = await stockAnalyzer.batchAnalyzeStocksAsync(
            tickersToAnalyze,
            (completed, total) => {
              console.log(`Background analysis progress: ${completed}/${total}`);
            }
          );
          
          console.log(`Saving ${analyzed.length} analyzed stocks to database...`);
          for (const { recommendation } of analyzed) {
            await storage.createStockRecommendation(recommendation);
          }
          
          await storage.createRefreshLog({
            refreshType: "recommendations",
            status: "success",
            message: `Refreshed ${analyzed.length} stock recommendations across ${sectors.length} sectors (async)`,
          });
          
          console.log(`✓ Background refresh completed: ${analyzed.length} recommendations saved`);
        } catch (error) {
          console.error("Error in background refresh:", error);
          await storage.createRefreshLog({
            refreshType: "recommendations",
            status: "error",
            message: `Background refresh failed: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      })();
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      
      res.status(500).json({ message: "Failed to start recommendations refresh" });
    }
  });

  // Get refresh logs
  app.get("/api/refresh-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await storage.getRecentRefreshLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching refresh logs:", error);
      res.status(500).json({ message: "Failed to fetch refresh logs" });
    }
  });

  // Watchlist endpoints
  app.get("/api/watchlist", async (req, res) => {
    try {
      const items = await storage.getAllWatchlistItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      const { ticker, companyName, sector, currentPrice, marketCap } = req.body;
      
      if (!ticker || !companyName || currentPrice === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if already in watchlist
      const existing = await storage.getWatchlistItemByTicker(ticker);
      if (existing) {
        return res.status(409).json({ message: "Stock already in watchlist" });
      }

      const item = await storage.createWatchlistItem({
        ticker,
        companyName,
        sector: sector || null,
        addedPrice: currentPrice,
        currentPrice,
        priceChange: 0,
        priceChangePercent: 0,
        marketCap: marketCap || null,
      });

      res.json(item);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      await storage.deleteWatchlistItem(ticker);
      res.json({ message: "Removed from watchlist" });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
