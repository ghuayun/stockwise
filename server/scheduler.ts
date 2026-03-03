import cron from "node-cron";
import { storage } from "./storage";
import { stockAnalyzer } from "./services/stockAnalyzer";
import { stockDiscovery } from "./services/stockDiscovery";

export function setupScheduler() {
  // Get configuration from environment (5 per category)
  const getStockConfig = () => ({
    largeCaps: parseInt(process.env.LARGE_CAP_COUNT || "5"),
    midCaps: parseInt(process.env.MID_CAP_COUNT || "5"),
    smallCaps: parseInt(process.env.SMALL_CAP_COUNT || "5"),
  });

  const useDynamicDiscovery = process.env.USE_DYNAMIC_DISCOVERY === "true";

  // Helper function to refresh recommendations
  const refreshRecommendations = async (source: string) => {
    console.log(`[${source}] Fetching stock recommendations from ML backend...`);
    
    try {
      // Save current recommendations as historical before refreshing
      console.log(`[${source}] Saving current recommendations as historical snapshot...`);
      await storage.saveCurrentRecommendationsAsHistorical();
      
      // Define the 5 sectors we want recommendations for
      const sectors = [
        "Technology",
        "Healthcare", 
        "Financial Services",
        "Consumer Cyclical",
        "Energy"
      ];
      
      const stocksPerSector = 5;
      
      console.log(`[${source}] Requesting ${stocksPerSector} stocks per sector for ${sectors.length} sectors across 3 market cap categories`);
      
      let allCandidates: any[] = [];
      let mlBackendAvailable = true;
      
      // Try to fetch from ML backend for each sector
      for (const sector of sectors) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/candidates?limit=200&timeframe=1m&min_score=0&large_cap_count=${stocksPerSector}&mid_cap_count=${stocksPerSector}&small_cap_count=${stocksPerSector}&sector=${encodeURIComponent(sector)}`
          );
          
          if (!response.ok) {
            console.warn(`[${source}] ML backend returned ${response.status} for sector ${sector}`);
            mlBackendAvailable = false;
            break;
          }
          
          const data = await response.json();
          const largeCaps = (data.large_caps || []).map((c: any) => ({ ...c, market_cap_category: 'large', sector }));
          const midCaps = (data.mid_caps || []).map((c: any) => ({ ...c, market_cap_category: 'mid', sector }));
          const smallCaps = (data.small_caps || []).map((c: any) => ({ ...c, market_cap_category: 'small', sector }));
          
          console.log(`[${source}] Sector ${sector}: ${largeCaps.length} large, ${midCaps.length} mid, ${smallCaps.length} small caps`);
          
          allCandidates.push(...largeCaps, ...midCaps, ...smallCaps);
        } catch (error) {
          console.error(`[${source}] Error fetching sector ${sector} from ML backend:`, error);
          mlBackendAvailable = false;
          break;
        }
      }
      
      if (mlBackendAvailable && allCandidates.length > 0) {
        console.log(`[${source}] Received ${allCandidates.length} total candidates from ML backend`);
        
        const tickersToAnalyze = allCandidates.map((c: any) => c.ticker);
        console.log(`[${source}] Analyzing ${tickersToAnalyze.length} total stocks`);
        
        await storage.deleteAllStockRecommendations();
        
        const analyzed = await stockAnalyzer.batchAnalyzeStocks(tickersToAnalyze);
        
        for (const { recommendation } of analyzed) {
          await storage.createStockRecommendation(recommendation);
        }
        
        await storage.createRefreshLog({
          refreshType: "recommendations",
          status: "success",
          message: `${source}: ${analyzed.length} stocks analyzed across ${sectors.length} sectors (ML backend)`,
        });
        
        console.log(`[${source}] Completed: ${analyzed.length} stocks analyzed`);
        return analyzed.length;
      } else {
        console.log(`[${source}] ML backend not available, using fallback method`);
        throw new Error("ML backend unavailable");
      }
    } catch (error) {
      // Fallback to original discovery method
      console.log(`[${source}] Falling back to stock discovery...`);
      
      const config = getStockConfig();
      
      let stocks;
      if (useDynamicDiscovery) {
        console.log(`[${source}] Using dynamic stock discovery...`);
        stocks = await stockDiscovery.discoverStocks(config);
      } else {
        console.log(`[${source}] Using curated stock list...`);
        stocks = stockDiscovery.getCuratedStocks(config);
      }
      
      const allTickers = stocks.allTickers;
      console.log(`[${source}] Analyzing ${allTickers.length} stocks:`, allTickers.join(", "));
      
      await storage.deleteAllStockRecommendations();
      
      const analyzed = await stockAnalyzer.batchAnalyzeStocks(allTickers);
      
      for (const { recommendation } of analyzed) {
        await storage.createStockRecommendation(recommendation);
      }
      
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "success",
        message: `${source}: ${analyzed.length} stocks analyzed (fallback)`,
      });
      
      console.log(`[${source}] Completed: ${analyzed.length} stocks analyzed (fallback)`);
      return analyzed.length;
    }
  };

  // Run daily at 9:00 AM EST (market open)
  cron.schedule("0 9 * * 1-5", async () => {
    console.log("Starting daily stock recommendations refresh...");
    
    try {
      await refreshRecommendations("Daily refresh");
    } catch (error) {
      console.error("Error during daily refresh:", error);
      
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error during daily refresh",
      });
    }
  }, {
    timezone: "America/New_York"
  });

  // Run every 6 hours as backup
  cron.schedule("0 */6 * * *", async () => {
    console.log("Starting 6-hour stock recommendations refresh...");
    
    try {
      const recommendations = await storage.getAllStockRecommendations();
      
      if (recommendations.length === 0) {
        await refreshRecommendations("6-hour backup refresh");
      } else {
        console.log("Recommendations already exist, skipping 6-hour refresh");
      }
    } catch (error) {
      console.error("Error during 6-hour refresh:", error);
    }
  });

  console.log("Stock recommendation scheduler initialized");
  console.log("- Daily refresh: 9:00 AM EST (weekdays)");
  console.log("- Backup refresh: Every 6 hours");
}
