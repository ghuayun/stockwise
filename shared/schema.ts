import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stockRecommendations = pgTable("stock_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  companyName: text("company_name").notNull(),
  currentPrice: real("current_price").notNull(),
  priceChange: real("price_change").notNull(),
  priceChangePercent: real("price_change_percent").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  signal: varchar("signal", { length: 10 }).notNull(), // BUY, HOLD, SELL
  sentiment: varchar("sentiment", { length: 20 }).notNull(), // positive, neutral, negative
  sentimentScore: real("sentiment_score").notNull(),
  pe: real("pe"),
  volume: text("volume"),
  institutionalHolding: real("institutional_holding"),
  marketCap: text("market_cap").notNull(),
  marketCapCategory: varchar("market_cap_category", { length: 20 }).notNull(), // large, mid, small
  aiReasoning: text("ai_reasoning").notNull(),
  technicalAnalysis: text("technical_analysis"),
  mlScore: real("ml_score").notNull(), // CatBoost score
  llmScore: real("llm_score").notNull(), // Groq LLM score
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
});

export const stockAnalyses = pgTable("stock_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  companyName: text("company_name").notNull(),
  currentPrice: real("current_price").notNull(),
  priceChange: real("price_change").notNull(),
  priceChangePercent: real("price_change_percent").notNull(),
  signal: varchar("signal", { length: 10 }).notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  sentiment: varchar("sentiment", { length: 20 }).notNull(),
  sentimentScore: real("sentiment_score").notNull(),
  aiInsights: text("ai_insights").notNull(),
  technicalAnalysis: text("technical_analysis"),
  news: jsonb("news").notNull(), // Array of news items
  mlScore: real("ml_score").notNull(),
  llmScore: real("llm_score").notNull(),
  analyzedAt: timestamp("analyzed_at").notNull().defaultNow(),
});

export const upcomingIPOs = pgTable("upcoming_ipos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  ipoDate: text("ipo_date").notNull(),
  priceRange: text("price_range").notNull(),
  expectedValuation: text("expected_valuation").notNull(),
  sector: text("sector").notNull(),
  description: text("description").notNull(),
  interest: varchar("interest", { length: 20 }).notNull(), // high, medium, low
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const refreshLogs = pgTable("refresh_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  refreshType: varchar("refresh_type", { length: 50 }).notNull(), // recommendations, custom_analysis
  status: varchar("status", { length: 20 }).notNull(), // success, error
  message: text("message"),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
});

// Insert schemas
export const insertStockRecommendationSchema = createInsertSchema(stockRecommendations).omit({
  id: true,
  analyzedAt: true,
});

export const insertStockAnalysisSchema = createInsertSchema(stockAnalyses).omit({
  id: true,
  analyzedAt: true,
});

export const insertUpcomingIPOSchema = createInsertSchema(upcomingIPOs).omit({
  id: true,
  createdAt: true,
});

export const insertRefreshLogSchema = createInsertSchema(refreshLogs).omit({
  id: true,
  executedAt: true,
});

// Types
export type StockRecommendation = typeof stockRecommendations.$inferSelect;
export type InsertStockRecommendation = z.infer<typeof insertStockRecommendationSchema>;

export type StockAnalysis = typeof stockAnalyses.$inferSelect;
export type InsertStockAnalysis = z.infer<typeof insertStockAnalysisSchema>;

export type UpcomingIPO = typeof upcomingIPOs.$inferSelect;
export type InsertUpcomingIPO = z.infer<typeof insertUpcomingIPOSchema>;

export type RefreshLog = typeof refreshLogs.$inferSelect;
export type InsertRefreshLog = z.infer<typeof insertRefreshLogSchema>;
