/**
 * Service to fetch stock data directly from ML backend database
 * This avoids Yahoo Finance API rate limiting issues
 */
import Database from "better-sqlite3";

interface MLStockData {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  currentPrice: number;
  marketCap: number;
  avgVolume: number;
  peRatio: number | null;
  pbRatio: number | null;
  priceChange: number;
  priceChangePercent: number;
  compositeScore: number | null;
}

export class MLDatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = "./stockpredict/data/stocks.db") {
    try {
      this.db = new Database(dbPath);
      this.db.pragma("journal_mode = WAL");
      console.log(`✓ Connected to ML database: ${dbPath}`);
    } catch (error) {
      console.error(`Failed to connect to ML database: ${error}`);
      throw error;
    }
  }

  getStockData(ticker: string): MLStockData | null {
    try {
      // Get basic stock info
      const stock = this.db
        .prepare(
          `
        SELECT 
          ticker, name, sector, industry, 
          market_cap, current_price, avg_volume
        FROM stocks
        WHERE ticker = ?
      `
        )
        .get(ticker.toUpperCase()) as any;

      if (!stock) {
        console.warn(`Stock not found in ML database: ${ticker}`);
        return null;
      }

      // Get latest fundamental data
      const fundamental = this.db
        .prepare(
          `
        SELECT pe_ratio, pb_ratio
        FROM fundamentals
        WHERE ticker = ?
        ORDER BY date DESC
        LIMIT 1
      `
        )
        .get(ticker.toUpperCase()) as any;

      // Get latest daily data for price change
      const dailyData = this.db
        .prepare(
          `
        SELECT 
          close,
          (SELECT close FROM daily_data 
           WHERE ticker = ? AND date < (SELECT date FROM daily_data WHERE ticker = ? ORDER BY date DESC LIMIT 1)
           ORDER BY date DESC LIMIT 1) as prev_close
        FROM daily_data
        WHERE ticker = ?
        ORDER BY date DESC
        LIMIT 1
      `
        )
        .get(ticker.toUpperCase(), ticker.toUpperCase(), ticker.toUpperCase()) as any;

      let priceChange = 0;
      let priceChangePercent = 0;
      if (dailyData?.close && dailyData?.prev_close) {
        priceChange = dailyData.close - dailyData.prev_close;
        priceChangePercent = (priceChange / dailyData.prev_close) * 100;
      }

      // Get latest screening score
      const screeningScore = this.db
        .prepare(
          `
        SELECT composite_score
        FROM screening_scores
        WHERE ticker = ?
        ORDER BY date DESC
        LIMIT 1
      `
        )
        .get(ticker.toUpperCase()) as any;

      return {
        ticker: stock.ticker,
        name: stock.name || stock.ticker,
        sector: stock.sector || "Unknown",
        industry: stock.industry || "Unknown",
        currentPrice: stock.current_price || 0,
        marketCap: stock.market_cap || 0,
        avgVolume: stock.avg_volume || 0,
        peRatio: fundamental?.pe_ratio || null,
        pbRatio: fundamental?.pb_ratio || null,
        priceChange,
        priceChangePercent,
        compositeScore: screeningScore?.composite_score || null,
      };
    } catch (error) {
      console.error(`Error fetching stock data from ML DB for ${ticker}:`, error);
      return null;
    }
  }

  close(): void {
    this.db.close();
    console.log("Closed ML database connection");
  }
}

// Singleton instance
let instance: MLDatabaseService | null = null;

export function getMLDatabaseService(): MLDatabaseService {
  if (!instance) {
    instance = new MLDatabaseService();
  }
  return instance;
}
