import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Creating historical_recommendations table...");
  
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS historical_recommendations (
      id TEXT PRIMARY KEY,
      ticker TEXT NOT NULL,
      company_name TEXT NOT NULL,
      recommended_price REAL NOT NULL,
      current_price REAL,
      signal TEXT NOT NULL,
      confidence_score INTEGER NOT NULL,
      sentiment TEXT NOT NULL,
      ai_reasoning TEXT NOT NULL,
      ml_score REAL NOT NULL,
      llm_score REAL NOT NULL,
      recommended_at INTEGER NOT NULL,
      snapshot_date TEXT NOT NULL
    )
  `);
  
  console.log("✓ historical_recommendations table created successfully");
  
  // Create an index on snapshot_date for faster queries
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_snapshot_date 
    ON historical_recommendations(snapshot_date DESC)
  `);
  
  console.log("✓ Index on snapshot_date created");
  console.log("\nMigration completed successfully!");
  process.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
