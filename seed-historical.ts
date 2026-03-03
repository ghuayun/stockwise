import { storage } from "./server/storage";

// This script creates a historical snapshot from current recommendations
// so you can see data in the Historical tab immediately

async function seedHistoricalData() {
  console.log("Saving current recommendations as historical snapshot...");
  
  const currentRecommendations = await storage.getAllStockRecommendations();
  console.log(`Found ${currentRecommendations.length} current recommendations`);
  
  if (currentRecommendations.length === 0) {
    console.log("⚠ No current recommendations found. Please run the stock analyzer first.");
    process.exit(1);
  }
  
  await storage.saveCurrentRecommendationsAsHistorical();
  
  console.log("✓ Historical snapshot saved successfully!");
  
  // Show what was saved
  const historicalData = await storage.getHistoricalRecommendationsByDate();
  console.log(`\nHistorical data now contains ${historicalData.length} date(s):`);
  historicalData.forEach(({ date, recommendations }) => {
    console.log(`  - ${date}: ${recommendations.length} stocks (${recommendations.map(r => r.ticker).join(", ")})`);
  });
  
  process.exit(0);
}

seedHistoricalData().catch((error) => {
  console.error("Failed to seed historical data:", error);
  process.exit(1);
});
