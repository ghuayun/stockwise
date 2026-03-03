import { db } from './db';
import { stockRecommendations } from '@shared/schema';
import { desc } from 'drizzle-orm';

async function verifySectors() {
  const rows = await db
    .select()
    .from(stockRecommendations)
    .orderBy(desc(stockRecommendations.confidenceScore));
  
  console.log('\nCurrent recommendations with sector data:\n');
  console.log('Ticker | Company | Sector | Confidence');
  console.log('-'.repeat(80));
  
  for (const row of rows) {
    console.log(
      `${row.ticker.padEnd(6)} | ${row.companyName.substring(0, 30).padEnd(30)} | ${(row.sector || 'N/A').padEnd(20)} | ${row.confidenceScore}%`
    );
  }
  
  console.log('\nTotal recommendations:', rows.length);
  console.log('With sector:', rows.filter(r => r.sector && r.sector !== 'Unknown').length);
}

verifySectors().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
