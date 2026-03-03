import { storage } from "./storage";

async function clearIPOs() {
  try {
    console.log("Clearing all IPO data...");
    await storage.deleteAllUpcomingIPOs();
    console.log("✓ All IPO data cleared successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing IPOs:", error);
    process.exit(1);
  }
}

clearIPOs();
