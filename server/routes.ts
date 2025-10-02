import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stockAnalyzer } from "./services/stockAnalyzer";
import { 
  insertStockAnalysisSchema, 
  insertUpcomingIPOSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all stock recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getAllStockRecommendations();
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
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

  // Manual refresh of recommendations
  app.post("/api/refresh", async (req, res) => {
    try {
      const largeCaps = ["AAPL", "MSFT", "NVDA"];
      const midCaps = ["PLTR", "SNOW", "CRWD"];
      const smallCaps = ["IONQ", "RXRX", "RKLB"];
      
      const allTickers = [...largeCaps, ...midCaps, ...smallCaps];
      
      await storage.deleteAllStockRecommendations();
      
      const analyzed = await stockAnalyzer.batchAnalyzeStocks(allTickers);
      
      for (const { recommendation } of analyzed) {
        await storage.createStockRecommendation(recommendation);
      }
      
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "success",
        message: `Refreshed ${analyzed.length} stock recommendations`,
      });
      
      res.json({ 
        message: "Recommendations refreshed successfully", 
        count: analyzed.length 
      });
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      
      res.status(500).json({ message: "Failed to refresh recommendations" });
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

  const httpServer = createServer(app);

  return httpServer;
}
