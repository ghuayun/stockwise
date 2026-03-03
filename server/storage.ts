import { 
  type StockRecommendation, 
  type InsertStockRecommendation,
  type StockAnalysis,
  type InsertStockAnalysis,
  type UpcomingIPO,
  type InsertUpcomingIPO,
  type RefreshLog,
  type InsertRefreshLog,
  type HistoricalRecommendation,
  type InsertHistoricalRecommendation,
  type WatchlistItem,
  type InsertWatchlistItem,
  stockRecommendations,
  stockAnalyses,
  upcomingIPOs,
  refreshLogs,
  historicalRecommendations,
  watchlist,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Stock Recommendations
  getAllStockRecommendations(): Promise<StockRecommendation[]>;
  getStockRecommendationsByCategory(category: string): Promise<StockRecommendation[]>;
  getStockRecommendationsBySector(sector: string): Promise<StockRecommendation[]>;
  createStockRecommendation(recommendation: InsertStockRecommendation): Promise<StockRecommendation>;
  deleteAllStockRecommendations(): Promise<void>;
  
  // Stock Analyses (custom search)
  createStockAnalysis(analysis: InsertStockAnalysis): Promise<StockAnalysis>;
  getStockAnalysisByTicker(ticker: string): Promise<StockAnalysis | undefined>;
  getRecentStockAnalyses(limit: number): Promise<StockAnalysis[]>;
  
  // Upcoming IPOs
  getAllUpcomingIPOs(): Promise<UpcomingIPO[]>;
  getUpcomingIPOByTicker(ticker: string): Promise<UpcomingIPO | undefined>;
  createUpcomingIPO(ipo: InsertUpcomingIPO): Promise<UpcomingIPO>;
  deleteAllUpcomingIPOs(): Promise<void>;
  
  // Refresh Logs
  createRefreshLog(log: InsertRefreshLog): Promise<RefreshLog>;
  getRecentRefreshLogs(limit: number): Promise<RefreshLog[]>;
  
  // Historical Recommendations
  createHistoricalRecommendation(recommendation: InsertHistoricalRecommendation): Promise<HistoricalRecommendation>;
  getHistoricalRecommendationsByDate(): Promise<Array<{ date: string; recommendations: HistoricalRecommendation[] }>>;
  saveCurrentRecommendationsAsHistorical(): Promise<void>;
  
  // Watchlist
  getAllWatchlistItems(): Promise<WatchlistItem[]>;
  getWatchlistItemByTicker(ticker: string): Promise<WatchlistItem | undefined>;
  createWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem>;
  deleteWatchlistItem(ticker: string): Promise<void>;
  updateWatchlistPrices(): Promise<void>;
}

export class DbStorage implements IStorage {
  // Stock Recommendations
  async getAllStockRecommendations(): Promise<StockRecommendation[]> {
    return db.select().from(stockRecommendations).orderBy(desc(stockRecommendations.confidenceScore));
  }

  async getStockRecommendationsByCategory(category: string): Promise<StockRecommendation[]> {
    return db
      .select()
      .from(stockRecommendations)
      .where(eq(stockRecommendations.marketCapCategory, category))
      .orderBy(desc(stockRecommendations.confidenceScore));
  }

  async getStockRecommendationsBySector(sector: string): Promise<StockRecommendation[]> {
    return db
      .select()
      .from(stockRecommendations)
      .where(eq(stockRecommendations.sector, sector))
      .orderBy(desc(stockRecommendations.confidenceScore));
  }

  async createStockRecommendation(recommendation: InsertStockRecommendation): Promise<StockRecommendation> {
    const [created] = await db.insert(stockRecommendations).values(recommendation).returning();
    return created;
  }

  async deleteAllStockRecommendations(): Promise<void> {
    await db.delete(stockRecommendations);
  }

  // Stock Analyses
  async createStockAnalysis(analysis: InsertStockAnalysis): Promise<StockAnalysis> {
    // Convert news array to JSON string for SQLite
    const analysisWithJsonNews = {
      ...analysis,
      news: JSON.stringify(analysis.news)
    };
    const [created] = await db.insert(stockAnalyses).values(analysisWithJsonNews).returning();
    // Parse news back to array for response
    return {
      ...created,
      news: JSON.parse(created.news as string)
    };
  }

  async getStockAnalysisByTicker(ticker: string): Promise<StockAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(stockAnalyses)
      .where(eq(stockAnalyses.ticker, ticker))
      .orderBy(desc(stockAnalyses.analyzedAt))
      .limit(1);
    if (analysis) {
      return {
        ...analysis,
        news: JSON.parse(analysis.news as string)
      };
    }
    return analysis;
  }

  async getRecentStockAnalyses(limit: number): Promise<StockAnalysis[]> {
    const results = await db
      .select()
      .from(stockAnalyses)
      .orderBy(desc(stockAnalyses.analyzedAt))
      .limit(limit);
    // Parse news for each result
    return results.map(analysis => ({
      ...analysis,
      news: JSON.parse(analysis.news as string)
    }));
  }

  // Upcoming IPOs
  async getAllUpcomingIPOs(): Promise<UpcomingIPO[]> {
    return db.select().from(upcomingIPOs).orderBy(desc(upcomingIPOs.createdAt));
  }

  async getUpcomingIPOByTicker(ticker: string): Promise<UpcomingIPO | undefined> {
    const [ipo] = await db
      .select()
      .from(upcomingIPOs)
      .where(eq(upcomingIPOs.ticker, ticker))
      .limit(1);
    return ipo;
  }

  async createUpcomingIPO(ipo: InsertUpcomingIPO): Promise<UpcomingIPO> {
    const [created] = await db.insert(upcomingIPOs).values(ipo).returning();
    return created;
  }

  async deleteAllUpcomingIPOs(): Promise<void> {
    await db.delete(upcomingIPOs);
  }

  // Refresh Logs
  async createRefreshLog(log: InsertRefreshLog): Promise<RefreshLog> {
    const [created] = await db.insert(refreshLogs).values(log).returning();
    return created;
  }

  async getRecentRefreshLogs(limit: number): Promise<RefreshLog[]> {
    return db
      .select()
      .from(refreshLogs)
      .orderBy(desc(refreshLogs.executedAt))
      .limit(limit);
  }

  // Historical Recommendations
  async createHistoricalRecommendation(recommendation: InsertHistoricalRecommendation): Promise<HistoricalRecommendation> {
    const [created] = await db.insert(historicalRecommendations).values(recommendation).returning();
    return created;
  }

  async getHistoricalRecommendationsByDate(): Promise<Array<{ date: string; recommendations: HistoricalRecommendation[] }>> {
    // Get all historical recommendations grouped by snapshot_date
    const allHistorical = await db
      .select()
      .from(historicalRecommendations)
      .orderBy(desc(historicalRecommendations.snapshotDate));

    // Group by date
    const groupedByDate = allHistorical.reduce((acc, rec) => {
      const date = rec.snapshotDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(rec);
      return acc;
    }, {} as Record<string, HistoricalRecommendation[]>);

    // Convert to array format
    return Object.entries(groupedByDate)
      .map(([date, recommendations]) => ({ date, recommendations }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
  }

  async saveCurrentRecommendationsAsHistorical(): Promise<void> {
    const currentRecommendations = await this.getAllStockRecommendations();
    if (currentRecommendations.length === 0) {
      return;
    }

    const snapshotDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const historicalRecords = currentRecommendations.map(rec => ({
      ticker: rec.ticker,
      companyName: rec.companyName,
      recommendedPrice: rec.currentPrice,
      currentPrice: rec.currentPrice, // Will be updated when viewing history
      signal: rec.signal,
      confidenceScore: rec.confidenceScore,
      sentiment: rec.sentiment,
      aiReasoning: rec.aiReasoning,
      mlScore: rec.mlScore,
      llmScore: rec.llmScore,
      recommendedAt: rec.analyzedAt,
      snapshotDate,
    }));

    await db.insert(historicalRecommendations).values(historicalRecords);
  }

  // Watchlist methods
  async getAllWatchlistItems(): Promise<WatchlistItem[]> {
    return await db.select().from(watchlist).orderBy(desc(watchlist.addedAt));
  }

  async getWatchlistItemByTicker(ticker: string): Promise<WatchlistItem | undefined> {
    const items = await db.select().from(watchlist).where(eq(watchlist.ticker, ticker)).limit(1);
    return items[0];
  }

  async createWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const inserted = await db.insert(watchlist).values(item).returning();
    return inserted[0];
  }

  async deleteWatchlistItem(ticker: string): Promise<void> {
    await db.delete(watchlist).where(eq(watchlist.ticker, ticker));
  }

  async updateWatchlistPrices(): Promise<void> {
    // This method can be called periodically to update prices
    // For now, it's a placeholder - prices will be updated when fetched
    // In a production system, you'd fetch latest prices from Yahoo Finance
  }
}

export const storage = new DbStorage();
