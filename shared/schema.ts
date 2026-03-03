import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stockRecommendations = sqliteTable("stock_recommendations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticker: text("ticker").notNull(),
  companyName: text("company_name").notNull(),
  // Sector classification (e.g., Technology, Healthcare). Nullable initially for backfill.
  sector: text("sector"),
  currentPrice: real("current_price").notNull(),
  priceChange: real("price_change").notNull(),
  priceChangePercent: real("price_change_percent").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  signal: text("signal").notNull(), // BUY, HOLD, SELL
  sentiment: text("sentiment").notNull(), // positive, neutral, negative
  sentimentScore: real("sentiment_score").notNull(),
  pe: real("pe"),
  volume: text("volume"),
  institutionalHolding: real("institutional_holding"),
  marketCap: text("market_cap").notNull(),
  marketCapCategory: text("market_cap_category").notNull(), // large, mid, small
  aiReasoning: text("ai_reasoning").notNull(),
  technicalAnalysis: text("technical_analysis"),
  mlScore: real("ml_score").notNull(), // CatBoost score
  llmScore: real("llm_score").notNull(), // Groq LLM score
  analyzedAt: integer("analyzed_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const stockAnalyses = sqliteTable("stock_analyses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticker: text("ticker").notNull(),
  companyName: text("company_name").notNull(),
  currentPrice: real("current_price").notNull(),
  priceChange: real("price_change").notNull(),
  priceChangePercent: real("price_change_percent").notNull(),
  signal: text("signal").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  sentiment: text("sentiment").notNull(),
  sentimentScore: real("sentiment_score").notNull(),
  aiInsights: text("ai_insights").notNull(),
  technicalAnalysis: text("technical_analysis"),
  businessSummary: text("business_summary"),
  news: text("news").notNull(), // JSON string of news items
  mlScore: real("ml_score").notNull(),
  llmScore: real("llm_score").notNull(),
  analyzedAt: integer("analyzed_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const upcomingIPOs = sqliteTable("upcoming_ipos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyName: text("company_name").notNull(),
  ticker: text("ticker").notNull(),
  ipoDate: text("ipo_date").notNull(),
  priceRange: text("price_range").notNull(),
  expectedValuation: text("expected_valuation").notNull(),
  sector: text("sector").notNull(),
  description: text("description").notNull(),
  interest: text("interest").notNull(), // high, medium, low
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const refreshLogs = sqliteTable("refresh_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  refreshType: text("refresh_type").notNull(), // recommendations, custom_analysis
  status: text("status").notNull(), // success, error
  message: text("message"),
  executedAt: integer("executed_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Historical recommendations - snapshots of recommendations over time
export const historicalRecommendations = sqliteTable("historical_recommendations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticker: text("ticker").notNull(),
  companyName: text("company_name").notNull(),
  recommendedPrice: real("recommended_price").notNull(), // Price at time of recommendation
  currentPrice: real("current_price"), // Current price when viewing history
  signal: text("signal").notNull(), // BUY, HOLD, SELL
  confidenceScore: integer("confidence_score").notNull(),
  sentiment: text("sentiment").notNull(),
  aiReasoning: text("ai_reasoning").notNull(),
  mlScore: real("ml_score").notNull(),
  llmScore: real("llm_score").notNull(),
  recommendedAt: integer("recommended_at", { mode: 'timestamp' }).notNull(),
  snapshotDate: text("snapshot_date").notNull(), // YYYY-MM-DD for grouping
});

// Watchlist - user's tracked stocks
export const watchlist = sqliteTable("watchlist", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticker: text("ticker").notNull().unique(),
  companyName: text("company_name").notNull(),
  sector: text("sector"),
  addedPrice: real("added_price").notNull(), // Price when added to watchlist
  currentPrice: real("current_price").notNull(),
  priceChange: real("price_change").notNull(),
  priceChangePercent: real("price_change_percent").notNull(),
  marketCap: text("market_cap"),
  addedAt: integer("added_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Insert schemas
export const insertStockRecommendationSchema = createInsertSchema(stockRecommendations).omit({
  id: true,
  analyzedAt: true,
});

export const insertStockAnalysisSchema = createInsertSchema(stockAnalyses).omit({
  id: true,
  analyzedAt: true,
}).extend({
  // Override news to accept array (will be stringified in storage layer)
  news: z.any(),
});

export const insertUpcomingIPOSchema = createInsertSchema(upcomingIPOs).omit({
  id: true,
  createdAt: true,
});

export const insertRefreshLogSchema = createInsertSchema(refreshLogs).omit({
  id: true,
  executedAt: true,
});

export const insertHistoricalRecommendationSchema = createInsertSchema(historicalRecommendations).omit({
  id: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  addedAt: true,
});

// Types
export type StockRecommendation = typeof stockRecommendations.$inferSelect;
export type InsertStockRecommendation = z.infer<typeof insertStockRecommendationSchema>;

// Override StockAnalysis to have news as an array (it's parsed from JSON in storage layer)
export type StockAnalysis = Omit<typeof stockAnalyses.$inferSelect, 'news'> & {
  news: Array<{
    title: string;
    source: string;
    date: string;
    sentiment: "positive" | "neutral" | "negative";
    url: string;
  }>;
};
export type InsertStockAnalysis = z.infer<typeof insertStockAnalysisSchema>;

export type UpcomingIPO = typeof upcomingIPOs.$inferSelect;
export type InsertUpcomingIPO = z.infer<typeof insertUpcomingIPOSchema>;

export type RefreshLog = typeof refreshLogs.$inferSelect;
export type InsertRefreshLog = z.infer<typeof insertRefreshLogSchema>;

export type HistoricalRecommendation = typeof historicalRecommendations.$inferSelect;
export type InsertHistoricalRecommendation = z.infer<typeof insertHistoricalRecommendationSchema>;

export type WatchlistItem = typeof watchlist.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
