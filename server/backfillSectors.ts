import { db } from './db';
import { stockRecommendations } from '@shared/schema';
import { yahooFinanceService } from './services/yahooFinance';
import { eq } from 'drizzle-orm';

async function backfillSectors() {
  console.log('Starting sector backfill...');
  const rows = await db.select().from(stockRecommendations);
  let updated = 0;
  for (const row of rows) {
    if (row.sector && row.sector !== 'Unknown') continue;
    try {
      const profile = await yahooFinanceService.getCompanyProfile(row.ticker);
      const sector = profile?.sector || 'Unknown';
      if (sector !== row.sector) {
        await db.update(stockRecommendations).set({ sector }).where(eq(stockRecommendations.id, row.id));
        updated++;
        console.log(`Updated ${row.ticker} -> ${sector}`);
      }
    } catch (e) {
      console.log(`Failed sector fetch for ${row.ticker}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`Sector backfill complete. Updated ${updated} rows.`);
}

backfillSectors().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
