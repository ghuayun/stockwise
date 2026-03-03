import { storage } from "./storage";
import { ipoService } from "./services/ipoService";

export async function seedIPOs() {
  try {
    const existingIPOs = await storage.getAllUpcomingIPOs();
    
    if (existingIPOs.length > 0) {
      console.log("IPOs already seeded, skipping...");
      return;
    }

    console.log("Fetching real IPO data...");
    const ipos = await ipoService.fetchUpcomingIPOs();

    for (const ipo of ipos) {
      await storage.createUpcomingIPO(ipo);
    }

    console.log(`Seeded ${ipos.length} upcoming IPOs with real market data`);
  } catch (error) {
    console.error("Error seeding IPOs:", error);
  }
}
