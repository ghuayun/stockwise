import cron from "node-cron";
import { storage } from "./storage";
import { stockAnalyzer } from "./services/stockAnalyzer";

export function setupScheduler() {
  // Run daily at 9:00 AM EST (market open)
  cron.schedule("0 9 * * 1-5", async () => {
    console.log("Starting daily stock recommendations refresh...");
    
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
        message: `Daily refresh completed: ${analyzed.length} stocks analyzed`,
      });
      
      console.log(`Daily refresh completed: ${analyzed.length} stocks analyzed`);
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
        const largeCaps = ["AAPL", "MSFT", "NVDA"];
        const midCaps = ["PLTR", "SNOW", "CRWD"];
        const smallCaps = ["IONQ", "RXRX", "RKLB"];
        
        const allTickers = [...largeCaps, ...midCaps, ...smallCaps];
        
        const analyzed = await stockAnalyzer.batchAnalyzeStocks(allTickers);
        
        for (const { recommendation } of analyzed) {
          await storage.createStockRecommendation(recommendation);
        }
        
        await storage.createRefreshLog({
          refreshType: "recommendations",
          status: "success",
          message: `6-hour refresh completed: ${analyzed.length} stocks analyzed`,
        });
        
        console.log(`6-hour refresh completed: ${analyzed.length} stocks analyzed`);
      }
    } catch (error) {
      console.error("Error during 6-hour refresh:", error);
    }
  });

  console.log("Stock recommendation scheduler initialized");
  console.log("- Daily refresh: 9:00 AM EST (weekdays)");
  console.log("- Backup refresh: Every 6 hours");
}
