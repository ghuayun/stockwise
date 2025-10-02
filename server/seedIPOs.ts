import { storage } from "./storage";
import type { InsertUpcomingIPO } from "@shared/schema";

export async function seedIPOs() {
  try {
    const existingIPOs = await storage.getAllUpcomingIPOs();
    
    if (existingIPOs.length > 0) {
      console.log("IPOs already seeded, skipping...");
      return;
    }

    const ipos: InsertUpcomingIPO[] = [
      {
        companyName: "Stripe Inc.",
        ticker: "STRP",
        ipoDate: "March 2025",
        priceRange: "$35-$42",
        expectedValuation: "$65B",
        sector: "Fintech",
        interest: "high",
        description: "Leading online payment processing platform serving millions of businesses globally. Dominant position in developer-first payment infrastructure with expanding financial services.",
      },
      {
        companyName: "Discord Inc.",
        ticker: "DISC",
        ipoDate: "April 2025",
        priceRange: "$28-$34",
        expectedValuation: "$18B",
        sector: "Social Media",
        interest: "high",
        description: "Communication platform with 150M+ monthly active users. Strong engagement in gaming and growing adoption in education and communities.",
      },
      {
        companyName: "Databricks Inc.",
        ticker: "DBRX",
        ipoDate: "May 2025",
        priceRange: "$45-$52",
        expectedValuation: "$43B",
        sector: "Enterprise AI",
        interest: "high",
        description: "Unified data analytics platform combining data warehousing and AI/ML capabilities. Strong enterprise adoption with 10,000+ customers.",
      },
    ];

    for (const ipo of ipos) {
      await storage.createUpcomingIPO(ipo);
    }

    console.log(`Seeded ${ipos.length} upcoming IPOs`);
  } catch (error) {
    console.error("Error seeding IPOs:", error);
  }
}
