import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from "./shared/schema";

const sqlite = new Database('dev.db');
const db = drizzle(sqlite, { schema });

async function getDatabaseInfo() {
  console.log('\n=== DATABASE CONTENTS ===\n');
  
  // Stock Recommendations
  const recommendations = await db.select().from(schema.stockRecommendations);
  console.log(`📊 Stock Recommendations: ${recommendations.length} records`);
  if (recommendations.length > 0) {
    console.log('   Sample tickers:', recommendations.slice(0, 5).map(r => r.ticker).join(', '));
    console.log('   Latest update:', new Date(recommendations[0].analyzedAt).toLocaleString());
  }
  
  // Stock Analyses
  const analyses = await db.select().from(schema.stockAnalyses);
  console.log(`\n🔍 Stock Analyses: ${analyses.length} records`);
  if (analyses.length > 0) {
    console.log('   Tickers analyzed:', analyses.map(a => a.ticker).join(', '));
    console.log('   Latest analysis:', new Date(analyses[0].analyzedAt).toLocaleString());
  }
  
  // Upcoming IPOs
  const ipos = await db.select().from(schema.upcomingIPOs);
  console.log(`\n🚀 Upcoming IPOs: ${ipos.length} records`);
  if (ipos.length > 0) {
    console.log('   Companies:', ipos.map(ipo => ipo.companyName).join(', '));
  }
  
  // Refresh Logs
  const logs = await db.select().from(schema.refreshLogs);
  console.log(`\n📝 Refresh Logs: ${logs.length} records`);
  if (logs.length > 0) {
    const recent = logs.slice(-3);
    console.log('   Recent operations:');
    recent.forEach(log => {
      console.log(`   - ${log.refreshType}: ${log.status} at ${new Date(log.executedAt).toLocaleString()}`);
    });
  }
  
  console.log('\n========================\n');
}

getDatabaseInfo().then(() => process.exit(0)).catch(console.error);
