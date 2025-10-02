import { 
  type StockRecommendation, 
  type InsertStockRecommendation,
  type StockAnalysis,
  type InsertStockAnalysis,
  type UpcomingIPO,
  type InsertUpcomingIPO,
  type RefreshLog,
  type InsertRefreshLog,
  stockRecommendations,
  stockAnalyses,
  upcomingIPOs,
  refreshLogs,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Stock Recommendations
  getAllStockRecommendations(): Promise<StockRecommendation[]>;
  getStockRecommendationsByCategory(category: string): Promise<StockRecommendation[]>;
  createStockRecommendation(recommendation: InsertStockRecommendation): Promise<StockRecommendation>;
  deleteAllStockRecommendations(): Promise<void>;
  
  // Stock Analyses (custom search)
  createStockAnalysis(analysis: InsertStockAnalysis): Promise<StockAnalysis>;
  getStockAnalysisByTicker(ticker: string): Promise<StockAnalysis | undefined>;
  getRecentStockAnalyses(limit: number): Promise<StockAnalysis[]>;
  
  // Upcoming IPOs
  getAllUpcomingIPOs(): Promise<UpcomingIPO[]>;
  createUpcomingIPO(ipo: InsertUpcomingIPO): Promise<UpcomingIPO>;
  deleteAllUpcomingIPOs(): Promise<void>;
  
  // Refresh Logs
  createRefreshLog(log: InsertRefreshLog): Promise<RefreshLog>;
  getRecentRefreshLogs(limit: number): Promise<RefreshLog[]>;
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

  async createStockRecommendation(recommendation: InsertStockRecommendation): Promise<StockRecommendation> {
    const [created] = await db.insert(stockRecommendations).values(recommendation).returning();
    return created;
  }

  async deleteAllStockRecommendations(): Promise<void> {
    await db.delete(stockRecommendations);
  }

  // Stock Analyses
  async createStockAnalysis(analysis: InsertStockAnalysis): Promise<StockAnalysis> {
    const [created] = await db.insert(stockAnalyses).values(analysis).returning();
    return created;
  }

  async getStockAnalysisByTicker(ticker: string): Promise<StockAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(stockAnalyses)
      .where(eq(stockAnalyses.ticker, ticker))
      .orderBy(desc(stockAnalyses.analyzedAt))
      .limit(1);
    return analysis;
  }

  async getRecentStockAnalyses(limit: number): Promise<StockAnalysis[]> {
    return db
      .select()
      .from(stockAnalyses)
      .orderBy(desc(stockAnalyses.analyzedAt))
      .limit(limit);
  }

  // Upcoming IPOs
  async getAllUpcomingIPOs(): Promise<UpcomingIPO[]> {
    return db.select().from(upcomingIPOs).orderBy(desc(upcomingIPOs.createdAt));
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
}

export const storage = new DbStorage();
