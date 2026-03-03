var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  historicalRecommendations: () => historicalRecommendations,
  insertHistoricalRecommendationSchema: () => insertHistoricalRecommendationSchema,
  insertRefreshLogSchema: () => insertRefreshLogSchema,
  insertStockAnalysisSchema: () => insertStockAnalysisSchema,
  insertStockRecommendationSchema: () => insertStockRecommendationSchema,
  insertUpcomingIPOSchema: () => insertUpcomingIPOSchema,
  insertWatchlistSchema: () => insertWatchlistSchema,
  refreshLogs: () => refreshLogs,
  stockAnalyses: () => stockAnalyses,
  stockRecommendations: () => stockRecommendations,
  upcomingIPOs: () => upcomingIPOs,
  watchlist: () => watchlist
});
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var stockRecommendations, stockAnalyses, upcomingIPOs, refreshLogs, historicalRecommendations, watchlist, insertStockRecommendationSchema, insertStockAnalysisSchema, insertUpcomingIPOSchema, insertRefreshLogSchema, insertHistoricalRecommendationSchema, insertWatchlistSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    stockRecommendations = sqliteTable("stock_recommendations", {
      id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
      ticker: text("ticker").notNull(),
      companyName: text("company_name").notNull(),
      // Sector classification (e.g., Technology, Healthcare). Nullable initially for backfill.
      sector: text("sector"),
      currentPrice: real("current_price").notNull(),
      priceChange: real("price_change").notNull(),
      priceChangePercent: real("price_change_percent").notNull(),
      confidenceScore: integer("confidence_score").notNull(),
      signal: text("signal").notNull(),
      // BUY, HOLD, SELL
      sentiment: text("sentiment").notNull(),
      // positive, neutral, negative
      sentimentScore: real("sentiment_score").notNull(),
      pe: real("pe"),
      volume: text("volume"),
      institutionalHolding: real("institutional_holding"),
      marketCap: text("market_cap").notNull(),
      marketCapCategory: text("market_cap_category").notNull(),
      // large, mid, small
      aiReasoning: text("ai_reasoning").notNull(),
      technicalAnalysis: text("technical_analysis"),
      mlScore: real("ml_score").notNull(),
      // CatBoost score
      llmScore: real("llm_score").notNull(),
      // Groq LLM score
      analyzedAt: integer("analyzed_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    stockAnalyses = sqliteTable("stock_analyses", {
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
      news: text("news").notNull(),
      // JSON string of news items
      mlScore: real("ml_score").notNull(),
      llmScore: real("llm_score").notNull(),
      analyzedAt: integer("analyzed_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    upcomingIPOs = sqliteTable("upcoming_ipos", {
      id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
      companyName: text("company_name").notNull(),
      ticker: text("ticker").notNull(),
      ipoDate: text("ipo_date").notNull(),
      priceRange: text("price_range").notNull(),
      expectedValuation: text("expected_valuation").notNull(),
      sector: text("sector").notNull(),
      description: text("description").notNull(),
      interest: text("interest").notNull(),
      // high, medium, low
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    refreshLogs = sqliteTable("refresh_logs", {
      id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
      refreshType: text("refresh_type").notNull(),
      // recommendations, custom_analysis
      status: text("status").notNull(),
      // success, error
      message: text("message"),
      executedAt: integer("executed_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    historicalRecommendations = sqliteTable("historical_recommendations", {
      id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
      ticker: text("ticker").notNull(),
      companyName: text("company_name").notNull(),
      recommendedPrice: real("recommended_price").notNull(),
      // Price at time of recommendation
      currentPrice: real("current_price"),
      // Current price when viewing history
      signal: text("signal").notNull(),
      // BUY, HOLD, SELL
      confidenceScore: integer("confidence_score").notNull(),
      sentiment: text("sentiment").notNull(),
      aiReasoning: text("ai_reasoning").notNull(),
      mlScore: real("ml_score").notNull(),
      llmScore: real("llm_score").notNull(),
      recommendedAt: integer("recommended_at", { mode: "timestamp" }).notNull(),
      snapshotDate: text("snapshot_date").notNull()
      // YYYY-MM-DD for grouping
    });
    watchlist = sqliteTable("watchlist", {
      id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
      ticker: text("ticker").notNull().unique(),
      companyName: text("company_name").notNull(),
      sector: text("sector"),
      addedPrice: real("added_price").notNull(),
      // Price when added to watchlist
      currentPrice: real("current_price").notNull(),
      priceChange: real("price_change").notNull(),
      priceChangePercent: real("price_change_percent").notNull(),
      marketCap: text("market_cap"),
      addedAt: integer("added_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
    });
    insertStockRecommendationSchema = createInsertSchema(stockRecommendations).omit({
      id: true,
      analyzedAt: true
    });
    insertStockAnalysisSchema = createInsertSchema(stockAnalyses).omit({
      id: true,
      analyzedAt: true
    }).extend({
      // Override news to accept array (will be stringified in storage layer)
      news: z.any()
    });
    insertUpcomingIPOSchema = createInsertSchema(upcomingIPOs).omit({
      id: true,
      createdAt: true
    });
    insertRefreshLogSchema = createInsertSchema(refreshLogs).omit({
      id: true,
      executedAt: true
    });
    insertHistoricalRecommendationSchema = createInsertSchema(historicalRecommendations).omit({
      id: true
    });
    insertWatchlistSchema = createInsertSchema(watchlist).omit({
      id: true,
      addedAt: true
    });
  }
});

// server/db.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
var sqlite, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    sqlite = new Database("dev.db");
    db = drizzle(sqlite, { schema: schema_exports });
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DbStorage: () => DbStorage,
  storage: () => storage
});
import { eq, desc } from "drizzle-orm";
var DbStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DbStorage = class {
      // Stock Recommendations
      async getAllStockRecommendations() {
        return db.select().from(stockRecommendations).orderBy(desc(stockRecommendations.confidenceScore));
      }
      async getStockRecommendationsByCategory(category) {
        return db.select().from(stockRecommendations).where(eq(stockRecommendations.marketCapCategory, category)).orderBy(desc(stockRecommendations.confidenceScore));
      }
      async getStockRecommendationsBySector(sector) {
        return db.select().from(stockRecommendations).where(eq(stockRecommendations.sector, sector)).orderBy(desc(stockRecommendations.confidenceScore));
      }
      async createStockRecommendation(recommendation) {
        const [created] = await db.insert(stockRecommendations).values(recommendation).returning();
        return created;
      }
      async deleteAllStockRecommendations() {
        await db.delete(stockRecommendations);
      }
      // Stock Analyses
      async createStockAnalysis(analysis) {
        const analysisWithJsonNews = {
          ...analysis,
          news: JSON.stringify(analysis.news)
        };
        const [created] = await db.insert(stockAnalyses).values(analysisWithJsonNews).returning();
        return {
          ...created,
          news: JSON.parse(created.news)
        };
      }
      async getStockAnalysisByTicker(ticker) {
        const [analysis] = await db.select().from(stockAnalyses).where(eq(stockAnalyses.ticker, ticker)).orderBy(desc(stockAnalyses.analyzedAt)).limit(1);
        if (analysis) {
          return {
            ...analysis,
            news: JSON.parse(analysis.news)
          };
        }
        return analysis;
      }
      async getRecentStockAnalyses(limit) {
        const results = await db.select().from(stockAnalyses).orderBy(desc(stockAnalyses.analyzedAt)).limit(limit);
        return results.map((analysis) => ({
          ...analysis,
          news: JSON.parse(analysis.news)
        }));
      }
      // Upcoming IPOs
      async getAllUpcomingIPOs() {
        return db.select().from(upcomingIPOs).orderBy(desc(upcomingIPOs.createdAt));
      }
      async getUpcomingIPOByTicker(ticker) {
        const [ipo] = await db.select().from(upcomingIPOs).where(eq(upcomingIPOs.ticker, ticker)).limit(1);
        return ipo;
      }
      async createUpcomingIPO(ipo) {
        const [created] = await db.insert(upcomingIPOs).values(ipo).returning();
        return created;
      }
      async deleteAllUpcomingIPOs() {
        await db.delete(upcomingIPOs);
      }
      // Refresh Logs
      async createRefreshLog(log2) {
        const [created] = await db.insert(refreshLogs).values(log2).returning();
        return created;
      }
      async getRecentRefreshLogs(limit) {
        return db.select().from(refreshLogs).orderBy(desc(refreshLogs.executedAt)).limit(limit);
      }
      // Historical Recommendations
      async createHistoricalRecommendation(recommendation) {
        const [created] = await db.insert(historicalRecommendations).values(recommendation).returning();
        return created;
      }
      async getHistoricalRecommendationsByDate() {
        const allHistorical = await db.select().from(historicalRecommendations).orderBy(desc(historicalRecommendations.snapshotDate));
        const groupedByDate = allHistorical.reduce((acc, rec) => {
          const date = rec.snapshotDate;
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(rec);
          return acc;
        }, {});
        return Object.entries(groupedByDate).map(([date, recommendations]) => ({ date, recommendations })).sort((a, b) => b.date.localeCompare(a.date));
      }
      async saveCurrentRecommendationsAsHistorical() {
        const currentRecommendations = await this.getAllStockRecommendations();
        if (currentRecommendations.length === 0) {
          return;
        }
        const snapshotDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const historicalRecords = currentRecommendations.map((rec) => ({
          ticker: rec.ticker,
          companyName: rec.companyName,
          recommendedPrice: rec.currentPrice,
          currentPrice: rec.currentPrice,
          // Will be updated when viewing history
          signal: rec.signal,
          confidenceScore: rec.confidenceScore,
          sentiment: rec.sentiment,
          aiReasoning: rec.aiReasoning,
          mlScore: rec.mlScore,
          llmScore: rec.llmScore,
          recommendedAt: rec.analyzedAt,
          snapshotDate
        }));
        await db.insert(historicalRecommendations).values(historicalRecords);
      }
      // Watchlist methods
      async getAllWatchlistItems() {
        return await db.select().from(watchlist).orderBy(desc(watchlist.addedAt));
      }
      async getWatchlistItemByTicker(ticker) {
        const items = await db.select().from(watchlist).where(eq(watchlist.ticker, ticker)).limit(1);
        return items[0];
      }
      async createWatchlistItem(item) {
        const inserted = await db.insert(watchlist).values(item).returning();
        return inserted[0];
      }
      async deleteWatchlistItem(ticker) {
        await db.delete(watchlist).where(eq(watchlist.ticker, ticker));
      }
      async updateWatchlistPrices() {
      }
    };
    storage = new DbStorage();
  }
});

// server/services/yahooFinance.ts
var yahooFinance_exports = {};
__export(yahooFinance_exports, {
  YahooFinanceService: () => YahooFinanceService,
  getCompanyProfile: () => getCompanyProfile,
  yahooFinanceService: () => yahooFinanceService
});
import yahooFinance from "yahoo-finance2";
async function getCompanyProfile(ticker) {
  return yahooFinanceService.getCompanyProfile(ticker);
}
var YahooFinanceService, yahooFinanceService;
var init_yahooFinance = __esm({
  "server/services/yahooFinance.ts"() {
    "use strict";
    YahooFinanceService = class {
      async getStockQuote(ticker) {
        try {
          const quote = await yahooFinance.quote(ticker);
          return {
            symbol: quote.symbol,
            regularMarketPrice: quote.regularMarketPrice || 0,
            regularMarketChange: quote.regularMarketChange || 0,
            regularMarketChangePercent: quote.regularMarketChangePercent || 0,
            marketCap: quote.marketCap || 0,
            regularMarketVolume: quote.regularMarketVolume || 0,
            trailingPE: quote.trailingPE,
            shortName: quote.shortName,
            longName: quote.longName
          };
        } catch (error) {
          console.error(`Error fetching quote for ${ticker}:`, error);
          return null;
        }
      }
      async getStockData(ticker) {
        try {
          const quote = await this.getStockQuote(ticker);
          if (!quote) return null;
          const companyName = quote.longName || quote.shortName || ticker;
          const marketCap = quote.marketCap;
          const institutionalHolding = 0;
          return {
            ticker: quote.symbol,
            companyName,
            currentPrice: quote.regularMarketPrice,
            priceChange: quote.regularMarketChange,
            priceChangePercent: quote.regularMarketChangePercent,
            pe: quote.trailingPE || 0,
            volume: this.formatVolume(quote.regularMarketVolume),
            marketCap,
            marketCapFormatted: this.formatMarketCap(marketCap),
            institutionalHolding
          };
        } catch (error) {
          console.error(`Error fetching stock data for ${ticker}:`, error);
          return null;
        }
      }
      async getBatchStockData(tickers) {
        const promises = tickers.map((ticker) => this.getStockData(ticker));
        const results = await Promise.all(promises);
        return results.filter((data) => data !== null);
      }
      formatMarketCap(marketCap) {
        if (marketCap >= 1e12) {
          return `$${(marketCap / 1e12).toFixed(2)}T`;
        } else if (marketCap >= 1e9) {
          return `$${(marketCap / 1e9).toFixed(2)}B`;
        } else if (marketCap >= 1e6) {
          return `$${(marketCap / 1e6).toFixed(2)}M`;
        }
        return `$${marketCap.toFixed(0)}`;
      }
      formatVolume(volume) {
        if (volume >= 1e9) {
          return `${(volume / 1e9).toFixed(2)}B`;
        } else if (volume >= 1e6) {
          return `${(volume / 1e6).toFixed(1)}M`;
        } else if (volume >= 1e3) {
          return `${(volume / 1e3).toFixed(1)}K`;
        }
        return volume.toString();
      }
      getMarketCapCategory(marketCap) {
        if (marketCap >= 2e11) return "large";
        if (marketCap >= 1e10) return "mid";
        return "small";
      }
      async getCompanyProfile(ticker) {
        try {
          const result = await yahooFinance.quoteSummary(ticker, {
            modules: ["summaryProfile", "assetProfile"]
          });
          const profile = result.assetProfile || result.summaryProfile;
          if (!profile) {
            console.log(`No profile data found for ${ticker}`);
            return null;
          }
          return {
            businessSummary: profile.longBusinessSummary || "",
            website: profile.website,
            industry: profile.industry,
            sector: profile.sector
          };
        } catch (error) {
          console.error(`Error fetching company profile for ${ticker}:`, error);
          return null;
        }
      }
    };
    yahooFinanceService = new YahooFinanceService();
  }
});

// server/services/groqService.ts
var groqService_exports = {};
__export(groqService_exports, {
  GroqService: () => GroqService,
  analyzeIPO: () => analyzeIPO,
  groqService: () => groqService
});
import Groq from "groq-sdk";
async function analyzeIPO(companyName, ticker, sector, expectedValuation, priceRange, ipoDate, news) {
  return groqService.analyzeIPO(companyName, ticker, sector, expectedValuation, priceRange, ipoDate, news);
}
var groq, GroqService, groqService;
var init_groqService = __esm({
  "server/services/groqService.ts"() {
    "use strict";
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    GroqService = class {
      async analyzeStock(ticker, companyName, currentPrice, priceChangePercent, pe, marketCap, newsContext) {
        try {
          const prompt = `You are a professional stock analyst. Analyze the following stock and provide a recommendation.

Stock: ${ticker} - ${companyName}
Current Price: $${currentPrice}
Price Change (24h): ${priceChangePercent.toFixed(2)}%
P/E Ratio: ${pe || "N/A"}
Market Cap: ${marketCap}

Recent News Context:
${newsContext}

Provide your analysis in the following JSON format:
{
  "signal": "BUY" | "HOLD" | "SELL",
  "confidenceScore": <number 0-100>,
  "reasoning": "<brief explanation of recommendation>",
  "technicalAnalysis": "<technical analysis summary>"
}

Base your recommendation on:
1. Price momentum and trends
2. Valuation metrics (P/E ratio)
3. Market sentiment from news
4. Overall market position

Be concise and professional. Confidence score should reflect the strength of your conviction.`;
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 1024,
            response_format: { type: "json_object" }
          });
          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from Groq API");
          }
          const analysis = JSON.parse(content);
          return {
            signal: analysis.signal || "HOLD",
            confidenceScore: Math.min(100, Math.max(0, analysis.confidenceScore || 50)),
            reasoning: analysis.reasoning || "Analysis unavailable",
            technicalAnalysis: analysis.technicalAnalysis || "Technical analysis unavailable"
          };
        } catch (error) {
          console.error(`Error analyzing stock ${ticker} with Groq:`, error);
          return {
            signal: "HOLD",
            confidenceScore: 50,
            reasoning: "Unable to perform LLM analysis at this time.",
            technicalAnalysis: "Technical analysis unavailable due to API error."
          };
        }
      }
      async batchAnalyzeStocks(stocks) {
        const promises = stocks.map(
          (stock) => this.analyzeStock(
            stock.ticker,
            stock.companyName,
            stock.currentPrice,
            stock.priceChangePercent,
            stock.pe,
            stock.marketCap,
            stock.newsContext
          )
        );
        return Promise.all(promises);
      }
      async analyzeIPO(companyName, ticker, sector, expectedValuation, priceRange, ipoDate, news) {
        try {
          const newsContext = news.length > 0 ? news.map((n) => `- ${n.title} (${n.source}, ${n.sentiment})`).join("\n") : "No recent news available";
          const prompt = `You are a professional IPO analyst. Analyze the following upcoming IPO and provide detailed insights.

Company: ${companyName} (${ticker})
Sector: ${sector}
Expected Valuation: ${expectedValuation}
Price Range: ${priceRange}
IPO Date: ${ipoDate}

Recent News & Sentiment:
${newsContext}

Provide a comprehensive IPO analysis covering:
1. **Company Overview**: Brief description of what the company does and its market position
2. **Investment Thesis**: Key reasons why investors might be interested in this IPO
3. **Risk Factors**: Main concerns and potential risks for investors
4. **Valuation Assessment**: Commentary on whether the valuation seems reasonable given the sector and market conditions
5. **Recommendation**: Your overall assessment (Highly Attractive / Moderately Attractive / Cautious / Avoid) with reasoning

Write in a professional yet accessible tone. Be balanced and objective. Keep the total analysis to about 300-400 words.`;
          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 800
          });
          return completion.choices[0]?.message?.content || "Analysis unavailable";
        } catch (error) {
          console.error("Error in Groq IPO analysis:", error);
          return `Unable to generate detailed analysis at this time. Please review the company information and recent news to make your investment decision.`;
        }
      }
    };
    groqService = new GroqService();
  }
});

// server/services/finbertService.ts
var FinBERTService, finbertService;
var init_finbertService = __esm({
  "server/services/finbertService.ts"() {
    "use strict";
    FinBERTService = class {
      apiUrl = "https://api-inference.huggingface.co/models/ProsusAI/finbert";
      apiKey;
      constructor() {
        this.apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!this.apiKey) {
          console.log("FinBERT: Running without HuggingFace API key (rate limited)");
          console.log("Get a free key at: https://huggingface.co/settings/tokens");
        }
      }
      async analyzeSentiment(text2) {
        try {
          const headers = {
            "Content-Type": "application/json"
          };
          if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
          }
          const response = await fetch(this.apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              inputs: text2,
              options: { wait_for_model: true }
            })
          });
          if (!response.ok) {
            if (response.status === 503) {
              await new Promise((resolve) => setTimeout(resolve, 5e3));
              return this.analyzeSentiment(text2);
            }
            throw new Error(`FinBERT API error: ${response.status}`);
          }
          const results = await response.json();
          const predictions = results[0];
          const topPrediction = predictions.reduce(
            (max, curr) => curr.score > max.score ? curr : max
          );
          return {
            label: topPrediction.label,
            score: topPrediction.score
          };
        } catch (error) {
          console.error("Error calling FinBERT API:", error);
          return this.fallbackSentiment(text2);
        }
      }
      async analyzeMultipleTexts(texts) {
        const sentiments = await Promise.all(
          texts.map((text2) => this.analyzeSentiment(text2))
        );
        let totalScore = 0;
        const sentimentMap = {
          positive: 1,
          neutral: 0.5,
          negative: 0
        };
        sentiments.forEach((s) => {
          totalScore += sentimentMap[s.label] * s.score;
        });
        const avgScore = sentiments.length > 0 ? totalScore / sentiments.length : 0.5;
        let overallSentiment;
        if (avgScore > 0.6) overallSentiment = "positive";
        else if (avgScore < 0.4) overallSentiment = "negative";
        else overallSentiment = "neutral";
        return {
          overallSentiment,
          overallScore: avgScore,
          articleSentiments: texts.map((text2, i) => ({
            title: text2,
            sentiment: sentiments[i]
          }))
        };
      }
      async analyzeNewsArticles(articles) {
        if (articles.length === 0) {
          return {
            overallSentiment: "neutral",
            overallScore: 0.5,
            articleSentiments: []
          };
        }
        const titles = articles.map((a) => a.title);
        return this.analyzeMultipleTexts(titles);
      }
      fallbackSentiment(text2) {
        const positiveWords = [
          "surge",
          "gain",
          "rise",
          "growth",
          "profit",
          "strong",
          "beat",
          "exceed",
          "soar",
          "rally",
          "bullish",
          "upgrade",
          "expand",
          "success",
          "recover",
          "positive",
          "optimistic",
          "breakthrough",
          "boost",
          "high",
          "up"
        ];
        const negativeWords = [
          "fall",
          "drop",
          "decline",
          "loss",
          "weak",
          "miss",
          "plunge",
          "crash",
          "bearish",
          "downgrade",
          "cut",
          "struggle",
          "concern",
          "risk",
          "negative",
          "worry",
          "fear",
          "trouble",
          "low",
          "slump",
          "down"
        ];
        const lowerText = text2.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        positiveWords.forEach((word) => {
          if (lowerText.includes(word)) positiveCount++;
        });
        negativeWords.forEach((word) => {
          if (lowerText.includes(word)) negativeCount++;
        });
        if (positiveCount > negativeCount) {
          return { label: "positive", score: 0.7 };
        }
        if (negativeCount > positiveCount) {
          return { label: "negative", score: 0.7 };
        }
        return { label: "neutral", score: 0.6 };
      }
    };
    finbertService = new FinBERTService();
  }
});

// server/services/newsService.ts
var newsService_exports = {};
__export(newsService_exports, {
  NewsService: () => NewsService,
  getCompanyNews: () => getCompanyNews,
  newsService: () => newsService
});
import * as cheerio from "cheerio";
async function getCompanyNews(companyName, limit = 5) {
  return newsService.getCompanyNews(companyName, limit);
}
var NewsService, newsService;
var init_newsService = __esm({
  "server/services/newsService.ts"() {
    "use strict";
    init_finbertService();
    NewsService = class {
      finnhubApiKey;
      constructor() {
        this.finnhubApiKey = process.env.FINNHUB_API_KEY;
        if (!this.finnhubApiKey) {
          console.log("NewsService: Running without Finnhub API key");
          console.log("Get a free key at: https://finnhub.io/register");
          console.log("News will use fallback methods (limited)");
        }
      }
      async getStockNews(ticker) {
        try {
          if (this.finnhubApiKey) {
            const finnhubArticles = await this.getNewsFromFinnhub(ticker);
            if (finnhubArticles.length > 0) {
              console.log(`Found ${finnhubArticles.length} articles from Finnhub for ${ticker}`);
              return finnhubArticles;
            }
          }
          const rssArticles = await this.getNewsFromYahooRSS(ticker);
          if (rssArticles.length > 0) {
            console.log(`Found ${rssArticles.length} articles from Yahoo RSS for ${ticker}`);
            return rssArticles;
          }
          const scrapedArticles = await this.scrapeYahooNews(ticker);
          if (scrapedArticles.length > 0) {
            console.log(`Found ${scrapedArticles.length} articles from scraping for ${ticker}`);
            return scrapedArticles;
          }
          console.log(`No news found for ${ticker}, generating synthetic news context`);
          return this.generateSyntheticNews(ticker);
        } catch (error) {
          console.error(`Error fetching news for ${ticker}:`, error);
          return this.generateSyntheticNews(ticker);
        }
      }
      async getNewsFromFinnhub(ticker) {
        try {
          const fromDate = /* @__PURE__ */ new Date();
          fromDate.setDate(fromDate.getDate() - 7);
          const from = fromDate.toISOString().split("T")[0];
          const to = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${this.finnhubApiKey}`;
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`Finnhub API error: ${response.status}`);
            return [];
          }
          const data = await response.json();
          if (!Array.isArray(data) || data.length === 0) {
            return [];
          }
          const articles = data.slice(0, 5).map((item) => ({
            title: item.headline || "No title",
            source: item.source || "Finnhub",
            date: this.formatDate(new Date(item.datetime * 1e3).toISOString()),
            sentiment: "neutral",
            // Will be updated by FinBERT
            url: item.url || `https://finnhub.io/`
          }));
          if (articles.length > 0) {
            console.log(`Analyzing sentiment for ${articles.length} articles using FinBERT...`);
            const analysis = await finbertService.analyzeNewsArticles(articles);
            articles.forEach((article, i) => {
              if (analysis.articleSentiments[i]) {
                article.sentiment = analysis.articleSentiments[i].sentiment.label;
                article.sentimentScore = analysis.articleSentiments[i].sentiment.score;
              }
            });
          }
          return articles;
        } catch (error) {
          console.error(`Error fetching from Finnhub for ${ticker}:`, error);
          return [];
        }
      }
      async getNewsFromYahooRSS(ticker) {
        try {
          const rssUrl = `https://finance.yahoo.com/rss/headline?s=${ticker}`;
          const response = await fetch(rssUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });
          if (!response.ok) {
            return [];
          }
          const xml = await response.text();
          const $ = cheerio.load(xml, { xmlMode: true });
          const articles = [];
          $("item").slice(0, 5).each((_, element) => {
            const title = $(element).find("title").text().trim();
            const link = $(element).find("link").text().trim();
            const pubDate = $(element).find("pubDate").text().trim();
            if (title && link) {
              articles.push({
                title,
                source: "Yahoo Finance",
                date: this.formatDate(pubDate),
                sentiment: "neutral",
                // Will be updated by FinBERT
                url: link
              });
            }
          });
          if (articles.length > 0) {
            console.log(`Analyzing sentiment for ${articles.length} articles using FinBERT...`);
            const analysis = await finbertService.analyzeNewsArticles(articles);
            articles.forEach((article, i) => {
              if (analysis.articleSentiments[i]) {
                article.sentiment = analysis.articleSentiments[i].sentiment.label;
                article.sentimentScore = analysis.articleSentiments[i].sentiment.score;
              }
            });
          }
          return articles;
        } catch (error) {
          console.error(`Error fetching RSS for ${ticker}:`, error);
          return [];
        }
      }
      async scrapeYahooNews(ticker) {
        try {
          const url = `https://finance.yahoo.com/quote/${ticker}/news`;
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
          });
          if (!response.ok) {
            return [];
          }
          const html = await response.text();
          const $ = cheerio.load(html);
          const articles = [];
          const selectors = [
            "li.stream-item",
            "div[data-test='news-stream'] li",
            "div.js-stream-content li",
            "[data-testid='news-stream'] li"
          ];
          for (const selector of selectors) {
            $(selector).slice(0, 5).each((_, element) => {
              const title = $(element).find("h3, h2, .title").first().text().trim();
              const source = $(element).find(".provider-name, .source").first().text().trim() || "Yahoo Finance";
              const timeText = $(element).find("time, .time").first().text().trim();
              const link = $(element).find("a").first().attr("href");
              if (title && link && !articles.some((a) => a.title === title)) {
                articles.push({
                  title,
                  source,
                  date: timeText || "Recent",
                  sentiment: "neutral",
                  url: link.startsWith("http") ? link : `https://finance.yahoo.com${link}`
                });
              }
            });
            if (articles.length > 0) break;
          }
          if (articles.length > 0) {
            console.log(`Analyzing sentiment for ${articles.length} articles using FinBERT...`);
            const analysis = await finbertService.analyzeNewsArticles(articles);
            articles.forEach((article, i) => {
              if (analysis.articleSentiments[i]) {
                article.sentiment = analysis.articleSentiments[i].sentiment.label;
                article.sentimentScore = analysis.articleSentiments[i].sentiment.score;
              }
            });
          }
          return articles;
        } catch (error) {
          console.error(`Error scraping news for ${ticker}:`, error);
          return [];
        }
      }
      generateSyntheticNews(ticker) {
        const today = /* @__PURE__ */ new Date();
        const newsTemplates = [
          {
            title: `${ticker} stock shows mixed trading signals amid market volatility`,
            sentiment: "neutral",
            sentimentScore: 0.6
          },
          {
            title: `Analysts maintain watchlist status for ${ticker} shares`,
            sentiment: "neutral",
            sentimentScore: 0.55
          },
          {
            title: `${ticker} trading volume reflects investor interest`,
            sentiment: "neutral",
            sentimentScore: 0.5
          }
        ];
        return newsTemplates.map((template, i) => ({
          ...template,
          source: "Market Summary",
          date: `${i} hours ago`,
          url: `https://finance.yahoo.com/quote/${ticker}`
        }));
      }
      formatDate(dateString) {
        try {
          const date = new Date(dateString);
          const now = /* @__PURE__ */ new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          if (diffHours < 1) return "Just now";
          if (diffHours < 24) return `${diffHours} hours ago`;
          if (diffDays < 7) return `${diffDays} days ago`;
          return date.toLocaleDateString();
        } catch {
          return "Recent";
        }
      }
      analyzeSentiment(text2) {
        const positiveWords = [
          "surge",
          "gain",
          "rise",
          "growth",
          "profit",
          "strong",
          "beat",
          "exceed",
          "soar",
          "rally",
          "bullish",
          "upgrade",
          "expand",
          "success",
          "recover",
          "positive",
          "optimistic",
          "breakthrough",
          "boost",
          "high"
        ];
        const negativeWords = [
          "fall",
          "drop",
          "decline",
          "loss",
          "weak",
          "miss",
          "plunge",
          "crash",
          "bearish",
          "downgrade",
          "cut",
          "struggle",
          "concern",
          "risk",
          "negative",
          "worry",
          "fear",
          "trouble",
          "low",
          "slump"
        ];
        const lowerText = text2.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        positiveWords.forEach((word) => {
          if (lowerText.includes(word)) positiveCount++;
        });
        negativeWords.forEach((word) => {
          if (lowerText.includes(word)) negativeCount++;
        });
        if (positiveCount > negativeCount) return "positive";
        if (negativeCount > positiveCount) return "negative";
        return "neutral";
      }
      getNewsContext(articles) {
        if (articles.length === 0) {
          return "No recent news available.";
        }
        return articles.slice(0, 3).map((article) => {
          const sentimentEmoji = {
            positive: "\u{1F4C8}",
            neutral: "\u27A1\uFE0F",
            negative: "\u{1F4C9}"
          }[article.sentiment];
          const confidence = article.sentimentScore ? ` [${(article.sentimentScore * 100).toFixed(0)}% confidence]` : "";
          return `${sentimentEmoji} ${article.title} (${article.source}, ${article.date})${confidence}`;
        }).join("\n");
      }
      calculateSentimentScore(articles) {
        if (articles.length === 0) return 0.5;
        const scores = articles.map((article) => {
          if (article.sentimentScore !== void 0) {
            const sentimentMap2 = {
              positive: 1,
              neutral: 0.5,
              negative: 0
            };
            return sentimentMap2[article.sentiment] * article.sentimentScore;
          }
          const sentimentMap = {
            positive: 1,
            neutral: 0.5,
            negative: 0
          };
          return sentimentMap[article.sentiment];
        });
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return avgScore;
      }
      getSentimentLabel(score) {
        if (score >= 0.6) return "positive";
        if (score <= 0.4) return "negative";
        return "neutral";
      }
      /**
       * Get news articles for a company by name (useful for IPOs without ticker symbols)
       */
      async getCompanyNews(companyName, limit = 5) {
        try {
          if (!this.finnhubApiKey) {
            console.log(`No Finnhub API key, generating synthetic news for ${companyName}`);
            return [];
          }
          const url = `https://finnhub.io/api/v1/news?category=general&token=${this.finnhubApiKey}`;
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`Finnhub API error: ${response.status}`);
            return [];
          }
          const data = await response.json();
          if (!Array.isArray(data) || data.length === 0) {
            return [];
          }
          const companyNameLower = companyName.toLowerCase();
          const relevantArticles = data.filter((article) => {
            const headline = (article.headline || "").toLowerCase();
            const summary = (article.summary || "").toLowerCase();
            return headline.includes(companyNameLower) || summary.includes(companyNameLower);
          });
          const articles = [];
          for (const article of relevantArticles.slice(0, limit)) {
            const headline = article.headline || "Untitled";
            const summary = article.summary || headline;
            const sentimentResult = await finbertService.analyzeSentiment(summary);
            const sentiment = sentimentResult.label;
            const sentimentScore = sentimentResult.score;
            articles.push({
              title: headline,
              source: article.source || "Unknown",
              date: new Date(article.datetime * 1e3).toLocaleDateString(),
              sentiment,
              sentimentScore: Math.round(sentimentScore * 100) / 100,
              url: article.url || "#"
            });
          }
          if (articles.length === 0) {
            console.log(`No specific news found for ${companyName}, returning general market news`);
            const generalArticles = data.slice(0, limit);
            for (const article of generalArticles) {
              const headline = article.headline || "Untitled";
              const summary = article.summary || headline;
              const sentimentResult = await finbertService.analyzeSentiment(summary);
              const sentiment = sentimentResult.label;
              const sentimentScore = sentimentResult.score;
              articles.push({
                title: headline,
                source: article.source || "Unknown",
                date: new Date(article.datetime * 1e3).toLocaleDateString(),
                sentiment,
                sentimentScore: Math.round(sentimentScore * 100) / 100,
                url: article.url || "#"
              });
            }
          }
          return articles;
        } catch (error) {
          console.error(`Error fetching company news for ${companyName}:`, error);
          return [];
        }
      }
    };
    newsService = new NewsService();
  }
});

// server/services/ipoService.ts
var ipoService_exports = {};
__export(ipoService_exports, {
  IPOService: () => IPOService,
  ipoService: () => ipoService
});
var IPOService, ipoService;
var init_ipoService = __esm({
  "server/services/ipoService.ts"() {
    "use strict";
    IPOService = class {
      apiKey;
      constructor() {
        this.apiKey = process.env.FINNHUB_API_KEY || "";
        if (!this.apiKey) {
          console.warn("FINNHUB_API_KEY not set - IPO data will not be available");
        }
      }
      /**
       * Fetches upcoming IPOs from Finnhub API for the next month
       */
      async fetchUpcomingIPOs() {
        if (!this.apiKey) {
          console.error("No Finnhub API key configured");
          return [];
        }
        try {
          const today = /* @__PURE__ */ new Date();
          const fromDate = this.formatDate(today);
          const futureDate = /* @__PURE__ */ new Date();
          futureDate.setDate(today.getDate() + 30);
          const toDate = this.formatDate(futureDate);
          const url = `https://finnhub.io/api/v1/calendar/ipo?from=${fromDate}&to=${toDate}&token=${this.apiKey}`;
          console.log(`Fetching IPOs from Finnhub: ${fromDate} to ${toDate}`);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Finnhub API returned ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          const ipoCalendar = data.ipoCalendar || [];
          console.log(`Received ${ipoCalendar.length} IPOs from Finnhub`);
          const ipos = [];
          for (const ipo of ipoCalendar) {
            try {
              const companyName = ipo.name || "";
              const ticker = ipo.symbol || "";
              const ipoDate = ipo.date || "";
              const exchange = ipo.exchange || "";
              const numberOfShares = ipo.numberOfShares || 0;
              const price = ipo.price || "";
              const totalSharesValue = ipo.totalSharesValue || 0;
              if (!companyName || companyName.length < 2) continue;
              let priceRange = "TBD";
              if (price) {
                priceRange = `$${price}`;
              }
              let expectedValuation = "TBD";
              if (totalSharesValue > 0) {
                const valuationInBillions = totalSharesValue / 1e9;
                if (valuationInBillions >= 1) {
                  expectedValuation = `$${valuationInBillions.toFixed(1)}B`;
                } else {
                  const valuationInMillions = totalSharesValue / 1e6;
                  expectedValuation = `$${valuationInMillions.toFixed(0)}M`;
                }
              } else if (numberOfShares > 0 && price) {
                const priceNum = parseFloat(price.toString().replace(/[^0-9.]/g, ""));
                if (!isNaN(priceNum)) {
                  const estimatedValue = numberOfShares * priceNum;
                  const valuationInBillions = estimatedValue / 1e9;
                  if (valuationInBillions >= 1) {
                    expectedValuation = `$${valuationInBillions.toFixed(1)}B`;
                  } else {
                    const valuationInMillions = estimatedValue / 1e6;
                    expectedValuation = `$${valuationInMillions.toFixed(0)}M`;
                  }
                }
              }
              const sector = this.determineSector(companyName);
              const displayDate = this.formatDisplayDate(ipoDate);
              ipos.push({
                companyName,
                ticker: ticker || `${companyName.substring(0, 3).toUpperCase()}`,
                ipoDate: displayDate,
                priceRange,
                expectedValuation,
                sector,
                interest: this.determineInterest(expectedValuation, sector),
                description: `${companyName} is scheduled to go public on ${exchange || "the stock exchange"}.`
              });
            } catch (error) {
              console.error("Error parsing IPO from Finnhub:", error);
            }
          }
          console.log(`Successfully processed ${ipos.length} upcoming IPOs`);
          return ipos;
        } catch (error) {
          console.error("Failed to fetch IPOs from Finnhub:", error);
          return [];
        }
      }
      /**
       * Format date to YYYY-MM-DD for Finnhub API
       */
      formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      /**
       * Format date for display (e.g., "Oct 15, 2025")
       */
      formatDisplayDate(dateStr) {
        if (!dateStr) return "TBD";
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr;
          const month = date.toLocaleString("en-US", { month: "short" });
          const day = date.getDate();
          const year = date.getFullYear();
          return `${month} ${day}, ${year}`;
        } catch {
          return dateStr;
        }
      }
      /**
       * Determine sector from company name
       */
      determineSector(companyName) {
        const name = companyName.toLowerCase();
        if (name.includes("bio") || name.includes("pharma") || name.includes("therapeut") || name.includes("medical")) {
          return "Biotech";
        }
        if (name.includes("bank") || name.includes("financial") || name.includes("capital") || name.includes("payment")) {
          return "Fintech";
        }
        if (name.includes("energy") || name.includes("oil") || name.includes("solar") || name.includes("renewable")) {
          return "Energy";
        }
        if (name.includes("retail") || name.includes("consumer") || name.includes("food") || name.includes("restaurant")) {
          return "Consumer";
        }
        return "Technology";
      }
      /**
       * Determines interest level based on valuation and sector
       */
      determineInterest(valuation, sector) {
        const valuationNum = this.parseValuation(valuation);
        const hotSectors = ["Fintech", "Biotech", "Technology"];
        const isHotSector = hotSectors.includes(sector);
        if (valuationNum > 10 || isHotSector) return "high";
        if (valuationNum > 2) return "medium";
        return "low";
      }
      /**
       * Parse valuation string to numeric value in billions
       */
      parseValuation(valuation) {
        const match = valuation.match(/\$?([\d.]+)([BM])/);
        if (!match) return 0;
        const value = parseFloat(match[1]);
        const unit = match[2];
        return unit === "B" ? value : value / 1e3;
      }
    };
    ipoService = new IPOService();
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
init_storage();
import { createServer } from "http";

// server/services/stockAnalyzer.ts
init_yahooFinance();
init_groqService();
init_newsService();
var StockAnalyzer = class {
  async analyzeStock(ticker) {
    try {
      const response = await fetch(`http://localhost:8000/api/candidates?limit=50&timeframe=1m&min_score=60&large_cap_count=3&mid_cap_count=3&small_cap_count=3`);
      let stockData;
      let mlBackendScore = null;
      let sector;
      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.find((c) => c.ticker === ticker.toUpperCase());
        if (candidate) {
          mlBackendScore = candidate.composite_score || null;
          stockData = {
            ticker: candidate.ticker,
            companyName: candidate.name || candidate.ticker,
            currentPrice: candidate.current_price || 0,
            priceChange: 0,
            priceChangePercent: candidate.prediction?.predicted_return || 0,
            pe: candidate.pe_ratio || 0,
            volume: candidate.avg_volume ? candidate.avg_volume.toLocaleString() : "0",
            institutionalHolding: 0,
            marketCap: candidate.market_cap || 0,
            marketCapFormatted: `$${(candidate.market_cap / 1e9).toFixed(2)}B`
          };
          sector = candidate.sector;
        }
      }
      if (!stockData) {
        console.log(`Falling back to Yahoo Finance for ${ticker}`);
        stockData = await yahooFinanceService.getStockData(ticker);
        if (!stockData) {
          console.error(`Could not fetch data for ${ticker}`);
          return null;
        }
      }
      if (!sector) {
        try {
          const profile = await yahooFinanceService.getCompanyProfile(ticker);
          sector = profile?.sector;
        } catch (e) {
          console.log(`Sector lookup failed for ${ticker}:`, e);
        }
      }
      if (!sector) sector = "Unknown";
      const news = await newsService.getStockNews(ticker);
      const newsContext = newsService.getNewsContext(news);
      const sentimentScore = newsService.calculateSentimentScore(news);
      const sentiment = newsService.getSentimentLabel(sentimentScore);
      const llmAnalysis = await groqService.analyzeStock(
        ticker,
        stockData.companyName,
        stockData.currentPrice,
        stockData.priceChangePercent,
        stockData.pe,
        stockData.marketCapFormatted,
        newsContext
      );
      const mlScore = mlBackendScore !== null ? Math.round(mlBackendScore) : this.calculateMLScore(stockData, sentimentScore);
      const llmScore = llmAnalysis.confidenceScore;
      const hybridScore = Math.round(mlScore * 0.6 + llmScore * 0.4);
      const marketCapCategory = yahooFinanceService.getMarketCapCategory(stockData.marketCap);
      const recommendation = {
        ticker: stockData.ticker,
        companyName: stockData.companyName,
        sector,
        currentPrice: stockData.currentPrice,
        priceChange: stockData.priceChange,
        priceChangePercent: stockData.priceChangePercent,
        confidenceScore: hybridScore,
        signal: this.determineSignal(hybridScore, llmAnalysis.signal),
        sentiment,
        sentimentScore,
        pe: stockData.pe,
        volume: stockData.volume,
        institutionalHolding: stockData.institutionalHolding,
        marketCap: stockData.marketCapFormatted,
        marketCapCategory,
        aiReasoning: llmAnalysis.reasoning,
        technicalAnalysis: llmAnalysis.technicalAnalysis,
        mlScore,
        llmScore
      };
      return {
        recommendation,
        news
      };
    } catch (error) {
      console.error(`Error analyzing stock ${ticker}:`, error);
      return null;
    }
  }
  async analyzeCustomStock(ticker) {
    try {
      const response = await fetch(`http://localhost:8000/api/candidates?limit=50&timeframe=1m&min_score=60&large_cap_count=3&mid_cap_count=3&small_cap_count=3`);
      if (!response.ok) {
        console.error(`ML API returned ${response.status}`);
        return null;
      }
      const data = await response.json();
      const candidate = data.candidates?.find((c) => c.ticker === ticker.toUpperCase());
      let stockData;
      let mlBackendScore = null;
      let sector;
      if (!candidate) {
        console.error(`Ticker ${ticker} not found in ML candidates`);
        stockData = await yahooFinanceService.getStockData(ticker);
        if (!stockData) {
          console.error(`Could not fetch data for ${ticker}`);
          return null;
        }
      } else {
        mlBackendScore = candidate.composite_score || null;
        stockData = {
          ticker: candidate.ticker,
          companyName: candidate.name || candidate.ticker,
          currentPrice: candidate.current_price || 0,
          priceChange: 0,
          // Calculate from prediction if needed
          priceChangePercent: candidate.prediction?.predicted_return || 0,
          pe: candidate.pe_ratio || 0,
          volume: candidate.avg_volume ? candidate.avg_volume.toLocaleString() : "0",
          institutionalHolding: 0,
          marketCap: candidate.market_cap || 0,
          marketCapFormatted: `$${(candidate.market_cap / 1e9).toFixed(2)}B`
        };
        sector = candidate.sector;
      }
      const news = await newsService.getStockNews(ticker);
      const newsContext = newsService.getNewsContext(news);
      const sentimentScore = newsService.calculateSentimentScore(news);
      const sentiment = newsService.getSentimentLabel(sentimentScore);
      const companyProfile = await yahooFinanceService.getCompanyProfile(ticker);
      const businessSummary = companyProfile?.businessSummary || null;
      if (!sector) sector = companyProfile?.sector || "Unknown";
      const llmAnalysis = await groqService.analyzeStock(
        ticker,
        stockData.companyName,
        stockData.currentPrice,
        stockData.priceChangePercent,
        stockData.pe,
        stockData.marketCapFormatted,
        newsContext
      );
      const mlScore = mlBackendScore !== null ? Math.round(mlBackendScore) : this.calculateMLScore(stockData, sentimentScore);
      const llmScore = llmAnalysis.confidenceScore;
      const hybridScore = Math.round(mlScore * 0.6 + llmScore * 0.4);
      const aiInsights = `${stockData.companyName} analysis:

**Recommendation**: ${llmAnalysis.signal} with ${hybridScore}% confidence

**AI Reasoning**: ${llmAnalysis.reasoning}

**Technical Overview**: ${llmAnalysis.technicalAnalysis}

**Sentiment Analysis**: News sentiment is ${sentiment} (${(sentimentScore * 100).toFixed(0)}% positive) based on recent coverage.

**Hybrid Score**: The combined ML model (${mlScore}/100) and LLM analysis (${llmScore}/100) produces a ${hybridScore}/100 confidence score.`;
      const analysis = {
        ticker: stockData.ticker,
        companyName: stockData.companyName,
        currentPrice: stockData.currentPrice,
        priceChange: stockData.priceChange,
        priceChangePercent: stockData.priceChangePercent,
        signal: this.determineSignal(hybridScore, llmAnalysis.signal),
        confidenceScore: hybridScore,
        sentiment,
        sentimentScore,
        aiInsights,
        technicalAnalysis: llmAnalysis.technicalAnalysis,
        businessSummary,
        news,
        mlScore,
        llmScore
      };
      return { analysis };
    } catch (error) {
      console.error(`Error analyzing custom stock ${ticker}:`, error);
      return null;
    }
  }
  async batchAnalyzeStocks(tickers) {
    const promises = tickers.map((ticker) => this.analyzeStock(ticker));
    const results = await Promise.all(promises);
    return results.filter((result) => result !== null);
  }
  calculateMLScore(stockData, sentimentScore) {
    let score = 50;
    if (stockData.priceChangePercent > 2) score += 15;
    else if (stockData.priceChangePercent > 0) score += 8;
    else if (stockData.priceChangePercent < -2) score -= 15;
    else if (stockData.priceChangePercent < 0) score -= 8;
    if (stockData.pe > 0 && stockData.pe < 20) score += 10;
    else if (stockData.pe >= 20 && stockData.pe < 40) score += 5;
    else if (stockData.pe >= 40) score -= 5;
    const sentimentContribution = (sentimentScore - 0.5) * 40;
    score += sentimentContribution;
    if (stockData.institutionalHolding > 60) score += 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  determineSignal(confidenceScore, llmSignal) {
    if (confidenceScore >= 75 && llmSignal === "BUY") return "BUY";
    if (confidenceScore >= 70 && llmSignal === "BUY") return "BUY";
    if (confidenceScore <= 40 && llmSignal === "SELL") return "SELL";
    if (confidenceScore <= 45 && llmSignal === "SELL") return "SELL";
    return "HOLD";
  }
};
var stockAnalyzer = new StockAnalyzer();

// server/services/stockDiscovery.ts
import yahooFinance2 from "yahoo-finance2";
var StockDiscoveryService = class {
  fallbackTickers = {
    largeCaps: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK.B", "JPM", "V"],
    midCaps: ["PLTR", "SNOW", "CRWD", "NET", "DDOG", "ZS", "MDB", "OKTA", "TEAM", "WDAY"],
    smallCaps: ["IONQ", "RXRX", "RKLB", "SPIR", "ACHR", "JOBY", "EVTL", "PATH", "S", "U"]
  };
  /**
   * Discover trending stocks dynamically from market data
   */
  async discoverStocks(config) {
    console.log("Discovering trending stocks...");
    try {
      const trending = await this.getTrendingStocks();
      if (trending.length > 0) {
        const classified = await this.classifyByMarketCap(trending);
        const largeCaps = classified.large.slice(0, config.largeCaps);
        const midCaps = classified.mid.slice(0, config.midCaps);
        const smallCaps = classified.small.slice(0, config.smallCaps);
        const finalLarge = this.supplementWithFallbacks(largeCaps, this.fallbackTickers.largeCaps, config.largeCaps);
        const finalMid = this.supplementWithFallbacks(midCaps, this.fallbackTickers.midCaps, config.midCaps);
        const finalSmall = this.supplementWithFallbacks(smallCaps, this.fallbackTickers.smallCaps, config.smallCaps);
        console.log(`Discovered: ${finalLarge.length} large caps, ${finalMid.length} mid caps, ${finalSmall.length} small caps`);
        return {
          largeCaps: finalLarge,
          midCaps: finalMid,
          smallCaps: finalSmall,
          allTickers: [...finalLarge, ...finalMid, ...finalSmall]
        };
      }
    } catch (error) {
      console.error("Error discovering stocks:", error);
    }
    console.log("Using fallback stock lists");
    return this.getFallbackStocks(config);
  }
  /**
   * Get trending stocks from market screeners
   */
  async getTrendingStocks() {
    try {
      const screenerResult = await yahooFinance2.screener({
        scrIds: "most_actives",
        // Most active by volume
        count: 50
      });
      if (screenerResult?.quotes && screenerResult.quotes.length > 0) {
        const tickers = screenerResult.quotes.filter(
          (quote) => quote.symbol && !quote.symbol.includes(".") && // No foreign exchanges
          quote.symbol.length <= 5 && // Typical US ticker length
          quote.quoteType === "EQUITY"
          // Only equities
        ).map((quote) => quote.symbol);
        console.log(`Found ${tickers.length} trending stocks from market screener`);
        return tickers;
      }
    } catch (error) {
      console.error("Error fetching trending stocks:", error);
    }
    try {
      const gainersResult = await yahooFinance2.screener({
        scrIds: "day_gainers",
        count: 30
      });
      if (gainersResult?.quotes && gainersResult.quotes.length > 0) {
        const tickers = gainersResult.quotes.filter(
          (quote) => quote.symbol && !quote.symbol.includes(".") && quote.symbol.length <= 5 && quote.quoteType === "EQUITY"
        ).map((quote) => quote.symbol);
        console.log(`Found ${tickers.length} gaining stocks from market screener`);
        return tickers;
      }
    } catch (error) {
      console.error("Error fetching gainers:", error);
    }
    return [];
  }
  /**
   * Classify stocks by market cap
   */
  async classifyByMarketCap(tickers) {
    const large = [];
    const mid = [];
    const small = [];
    for (const ticker of tickers) {
      try {
        const quote = await yahooFinance2.quote(ticker);
        if (quote?.marketCap) {
          const marketCap = quote.marketCap;
          if (marketCap > 2e11) {
            large.push(ticker);
          } else if (marketCap > 1e10) {
            mid.push(ticker);
          } else if (marketCap > 3e8) {
            small.push(ticker);
          }
        }
      } catch (error) {
        console.error(`Error classifying ${ticker}:`, error);
      }
    }
    console.log(`Classified: ${large.length} large, ${mid.length} mid, ${small.length} small cap stocks`);
    return { large, mid, small };
  }
  /**
   * Supplement discovered stocks with fallbacks if needed
   */
  supplementWithFallbacks(discovered, fallbacks, targetCount) {
    const result = [...discovered];
    const needed = targetCount - result.length;
    if (needed > 0) {
      const available = fallbacks.filter((ticker) => !result.includes(ticker));
      result.push(...available.slice(0, needed));
    }
    return result.slice(0, targetCount);
  }
  /**
   * Get fallback stocks when discovery fails
   */
  getFallbackStocks(config) {
    const largeCaps = this.fallbackTickers.largeCaps.slice(0, config.largeCaps);
    const midCaps = this.fallbackTickers.midCaps.slice(0, config.midCaps);
    const smallCaps = this.fallbackTickers.smallCaps.slice(0, config.smallCaps);
    return {
      largeCaps,
      midCaps,
      smallCaps,
      allTickers: [...largeCaps, ...midCaps, ...smallCaps]
    };
  }
  /**
   * Get curated high-quality stocks (for testing/demo)
   */
  getCuratedStocks(config) {
    return this.getFallbackStocks(config);
  }
};
var stockDiscovery = new StockDiscoveryService();

// server/routes.ts
init_yahooFinance();
init_schema();
async function registerRoutes(app2) {
  app2.get("/api/market-data", async (req, res) => {
    try {
      const symbols = ["^GSPC", "^DJI", "^IXIC", "QQQ"];
      const quotes = await Promise.all(
        symbols.map((symbol) => yahooFinanceService.getStockQuote(symbol))
      );
      const marketData = quotes.map((quote, index) => {
        if (!quote) return null;
        const labels = ["S&P 500", "DOW", "NASDAQ", "QQQ"];
        return {
          label: labels[index],
          symbol: quote.symbol,
          value: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent
        };
      }).filter((data) => data !== null);
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });
  app2.get("/api/recommendations", async (req, res) => {
    try {
      const sectorParam = req.query.sector?.trim();
      let recommendations;
      if (sectorParam) {
        const normalized = sectorParam.toLowerCase();
        let sectorValue;
        if (["tech", "technology", "information technology", "it"].includes(normalized)) {
          sectorValue = "Technology";
        } else {
          sectorValue = normalized.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
        recommendations = await storage.getStockRecommendationsBySector(sectorValue);
      } else {
        recommendations = await storage.getAllStockRecommendations();
      }
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  app2.get("/api/recommendations/historical", async (req, res) => {
    try {
      const historicalData = await storage.getHistoricalRecommendationsByDate();
      const formattedData = await Promise.all(historicalData.map(async ({ date, recommendations }) => {
        const stocksWithCurrentPrices = await Promise.all(recommendations.map(async (rec) => {
          let currentPrice = rec.recommendedPrice;
          try {
            const quote = await yahooFinanceService.getStockQuote(rec.ticker);
            currentPrice = quote?.regularMarketPrice || rec.recommendedPrice;
          } catch (error) {
            console.warn(`Could not fetch current price for ${rec.ticker}, using recommended price`);
          }
          return {
            ticker: rec.ticker,
            companyName: rec.companyName,
            recommendedPrice: rec.recommendedPrice,
            currentPrice,
            performance: (currentPrice - rec.recommendedPrice) / rec.recommendedPrice * 100,
            signal: rec.signal
          };
        }));
        return {
          date: new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }),
          stocks: stocksWithCurrentPrices
        };
      }));
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching historical recommendations:", error);
      res.status(500).json({ message: "Failed to fetch historical recommendations" });
    }
  });
  app2.get("/api/recommendations/:category", async (req, res) => {
    try {
      const { category } = req.params;
      if (!["large", "mid", "small"].includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      const recommendations = await storage.getStockRecommendationsByCategory(category);
      res.json(recommendations);
    } catch (error) {
      console.error(`Error fetching ${req.params.category} recommendations:`, error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  app2.post("/api/analyze", async (req, res) => {
    try {
      const { ticker } = req.body;
      if (!ticker || typeof ticker !== "string") {
        return res.status(400).json({ message: "Ticker is required" });
      }
      const upperTicker = ticker.toUpperCase();
      const existing = await storage.getStockAnalysisByTicker(upperTicker);
      if (existing) {
        const ageMinutes = (Date.now() - new Date(existing.analyzedAt).getTime()) / 1e3 / 60;
        if (ageMinutes < 30) {
          return res.json(existing);
        }
      }
      const result = await stockAnalyzer.analyzeCustomStock(upperTicker);
      if (!result) {
        return res.status(404).json({ message: "Stock not found or analysis failed" });
      }
      const validatedAnalysis = insertStockAnalysisSchema.parse(result.analysis);
      const savedAnalysis = await storage.createStockAnalysis(validatedAnalysis);
      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error analyzing stock:", error);
      res.status(500).json({ message: "Failed to analyze stock" });
    }
  });
  app2.get("/api/analyses", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const analyses = await storage.getRecentStockAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });
  app2.get("/api/ipos", async (req, res) => {
    try {
      const ipos = await storage.getAllUpcomingIPOs();
      res.json(ipos);
    } catch (error) {
      console.error("Error fetching IPOs:", error);
      res.status(500).json({ message: "Failed to fetch IPOs" });
    }
  });
  app2.post("/api/ipos", async (req, res) => {
    try {
      const validatedIPO = insertUpcomingIPOSchema.parse(req.body);
      const ipo = await storage.createUpcomingIPO(validatedIPO);
      res.json(ipo);
    } catch (error) {
      console.error("Error creating IPO:", error);
      res.status(500).json({ message: "Failed to create IPO" });
    }
  });
  app2.get("/api/ipos/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const ipo = await storage.getUpcomingIPOByTicker(ticker);
      if (!ipo) {
        return res.status(404).json({ message: "IPO not found" });
      }
      let businessSummary = ipo.description;
      let website = "";
      let industry = "";
      let sectorDetail = ipo.sector;
      if (ticker && ticker !== "TBD") {
        try {
          const { getCompanyProfile: getCompanyProfile2 } = await Promise.resolve().then(() => (init_yahooFinance(), yahooFinance_exports));
          const profile = await getCompanyProfile2(ticker);
          if (profile && profile.businessSummary) {
            businessSummary = profile.businessSummary;
            website = profile.website || "";
            industry = profile.industry || "";
            sectorDetail = profile.sector || ipo.sector;
          }
        } catch (error) {
          console.log(`Could not fetch company profile for ${ticker}, using default description`);
        }
      }
      const { getCompanyNews: getCompanyNews2 } = await Promise.resolve().then(() => (init_newsService(), newsService_exports));
      const news = await getCompanyNews2(ipo.companyName, 5);
      const { analyzeIPO: analyzeIPO2 } = await Promise.resolve().then(() => (init_groqService(), groqService_exports));
      const analysis = await analyzeIPO2(
        ipo.companyName,
        ipo.ticker,
        sectorDetail,
        ipo.expectedValuation,
        ipo.priceRange,
        ipo.ipoDate,
        news
      );
      res.json({
        ...ipo,
        description: businessSummary,
        sector: sectorDetail,
        website,
        industry,
        news,
        analysis
      });
    } catch (error) {
      console.error("Error fetching IPO details:", error);
      res.status(500).json({
        message: "Failed to fetch IPO details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/ipos/refresh", async (req, res) => {
    try {
      console.log("Refreshing IPO data from Finnhub...");
      const { ipoService: ipoService2 } = await Promise.resolve().then(() => (init_ipoService(), ipoService_exports));
      const ipos = await ipoService2.fetchUpcomingIPOs();
      console.log(`Fetched ${ipos.length} IPOs from service`);
      if (ipos.length === 0) {
        console.log("No IPOs fetched, using existing data");
        return res.status(500).json({
          message: "Failed to fetch IPO data. Using existing data."
        });
      }
      console.log("Clearing existing IPOs...");
      await storage.deleteAllUpcomingIPOs();
      console.log("Inserting new IPOs...");
      for (const ipo of ipos) {
        await storage.createUpcomingIPO(ipo);
      }
      console.log(`Successfully refreshed ${ipos.length} upcoming IPOs`);
      res.json({
        message: `Successfully refreshed ${ipos.length} upcoming IPOs`,
        count: ipos.length
      });
    } catch (error) {
      console.error("Error refreshing IPOs:", error);
      res.status(500).json({
        message: "Failed to refresh IPOs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/refresh", async (req, res) => {
    try {
      console.log("Fetching stock recommendations from ML backend...");
      const sectors = [
        "Technology",
        "Healthcare",
        "Financial Services",
        "Consumer Cyclical",
        "Energy"
      ];
      const stocksPerSector = 5;
      console.log(`Requesting ${stocksPerSector} stocks per sector for ${sectors.length} sectors across 3 market cap categories`);
      console.log(`Expected total: ${stocksPerSector * sectors.length * 3} = 75 recommendations`);
      let allCandidates = [];
      let mlBackendAvailable = true;
      for (const sector of sectors) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/candidates?limit=200&timeframe=1m&min_score=0&large_cap_count=${stocksPerSector}&mid_cap_count=${stocksPerSector}&small_cap_count=${stocksPerSector}&sector=${encodeURIComponent(sector)}`
          );
          if (!response.ok) {
            console.warn(`ML backend returned ${response.status} for sector ${sector}`);
            mlBackendAvailable = false;
            break;
          }
          const data = await response.json();
          const largeCaps = (data.large_caps || []).map((c) => ({ ...c, market_cap_category: "large", sector }));
          const midCaps = (data.mid_caps || []).map((c) => ({ ...c, market_cap_category: "mid", sector }));
          const smallCaps = (data.small_caps || []).map((c) => ({ ...c, market_cap_category: "small", sector }));
          console.log(`Sector ${sector}: ${largeCaps.length} large, ${midCaps.length} mid, ${smallCaps.length} small caps`);
          allCandidates.push(...largeCaps, ...midCaps, ...smallCaps);
        } catch (error) {
          console.error(`Error fetching sector ${sector} from ML backend:`, error);
          mlBackendAvailable = false;
          break;
        }
      }
      if (!mlBackendAvailable || allCandidates.length === 0) {
        console.log("ML backend unavailable or returned no data, falling back to dynamic discovery");
        const config = {
          largeCaps: parseInt(process.env.LARGE_CAP_COUNT || "5"),
          midCaps: parseInt(process.env.MID_CAP_COUNT || "5"),
          smallCaps: parseInt(process.env.SMALL_CAP_COUNT || "5")
        };
        const useDynamicDiscovery = process.env.USE_DYNAMIC_DISCOVERY === "true";
        let stocks;
        if (useDynamicDiscovery) {
          console.log("Using dynamic stock discovery...");
          stocks = await stockDiscovery.discoverStocks(config);
        } else {
          console.log("Using curated stock list...");
          stocks = stockDiscovery.getCuratedStocks(config);
        }
        const allTickers = stocks.allTickers;
        console.log(`Analyzing ${allTickers.length} stocks:`, allTickers.join(", "));
        console.log("Saving current recommendations as historical snapshot...");
        await storage.saveCurrentRecommendationsAsHistorical();
        await storage.deleteAllStockRecommendations();
        const analyzed2 = await stockAnalyzer.batchAnalyzeStocks(allTickers);
        for (const { recommendation } of analyzed2) {
          await storage.createStockRecommendation(recommendation);
        }
        await storage.createRefreshLog({
          refreshType: "recommendations",
          status: "success",
          message: `Refreshed ${analyzed2.length} stock recommendations (fallback method)`
        });
        return res.json({
          message: "Recommendations refreshed successfully (fallback)",
          count: analyzed2.length
        });
      }
      console.log(`Received ${allCandidates.length} total candidates from ML backend`);
      for (const sector of sectors) {
        const sectorCandidates = allCandidates.filter((c) => c.sector === sector);
        const largeCaps = sectorCandidates.filter((c) => c.market_cap_category === "large");
        const midCaps = sectorCandidates.filter((c) => c.market_cap_category === "mid");
        const smallCaps = sectorCandidates.filter((c) => c.market_cap_category === "small");
        console.log(`  ${sector}: ${largeCaps.length}L/${midCaps.length}M/${smallCaps.length}S`);
      }
      const tickersToAnalyze = allCandidates.map((c) => c.ticker);
      console.log(`Analyzing ${tickersToAnalyze.length} total stocks`);
      console.log("Saving current recommendations as historical snapshot...");
      await storage.saveCurrentRecommendationsAsHistorical();
      await storage.deleteAllStockRecommendations();
      const analyzed = await stockAnalyzer.batchAnalyzeStocks(tickersToAnalyze);
      for (const { recommendation } of analyzed) {
        await storage.createStockRecommendation(recommendation);
      }
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "success",
        message: `Refreshed ${analyzed.length} stock recommendations across ${sectors.length} sectors`
      });
      res.json({
        message: "Recommendations refreshed successfully",
        count: analyzed.length,
        bySector: sectors.reduce((acc, sector) => {
          acc[sector] = analyzed.filter((a) => a.recommendation.sector === sector).length;
          return acc;
        }, {})
      });
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
      res.status(500).json({ message: "Failed to refresh recommendations" });
    }
  });
  app2.get("/api/refresh-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const logs = await storage.getRecentRefreshLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching refresh logs:", error);
      res.status(500).json({ message: "Failed to fetch refresh logs" });
    }
  });
  app2.get("/api/watchlist", async (req, res) => {
    try {
      const items = await storage.getAllWatchlistItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });
  app2.post("/api/watchlist", async (req, res) => {
    try {
      const { ticker, companyName, sector, currentPrice, marketCap } = req.body;
      if (!ticker || !companyName || currentPrice === void 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const existing = await storage.getWatchlistItemByTicker(ticker);
      if (existing) {
        return res.status(409).json({ message: "Stock already in watchlist" });
      }
      const item = await storage.createWatchlistItem({
        ticker,
        companyName,
        sector: sector || null,
        addedPrice: currentPrice,
        currentPrice,
        priceChange: 0,
        priceChangePercent: 0,
        marketCap: marketCap || null
      });
      res.json(item);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });
  app2.delete("/api/watchlist/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      await storage.deleteWatchlistItem(ticker);
      res.json({ message: "Removed from watchlist" });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/scheduler.ts
init_storage();
import cron from "node-cron";
function setupScheduler() {
  const getStockConfig = () => ({
    largeCaps: parseInt(process.env.LARGE_CAP_COUNT || "5"),
    midCaps: parseInt(process.env.MID_CAP_COUNT || "5"),
    smallCaps: parseInt(process.env.SMALL_CAP_COUNT || "5")
  });
  const useDynamicDiscovery = process.env.USE_DYNAMIC_DISCOVERY === "true";
  const refreshRecommendations = async (source) => {
    console.log(`[${source}] Fetching stock recommendations from ML backend...`);
    try {
      console.log(`[${source}] Saving current recommendations as historical snapshot...`);
      await storage.saveCurrentRecommendationsAsHistorical();
      const sectors = [
        "Technology",
        "Healthcare",
        "Financial Services",
        "Consumer Cyclical",
        "Energy"
      ];
      const stocksPerSector = 5;
      console.log(`[${source}] Requesting ${stocksPerSector} stocks per sector for ${sectors.length} sectors across 3 market cap categories`);
      let allCandidates = [];
      let mlBackendAvailable = true;
      for (const sector of sectors) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/candidates?limit=200&timeframe=1m&min_score=0&large_cap_count=${stocksPerSector}&mid_cap_count=${stocksPerSector}&small_cap_count=${stocksPerSector}&sector=${encodeURIComponent(sector)}`
          );
          if (!response.ok) {
            console.warn(`[${source}] ML backend returned ${response.status} for sector ${sector}`);
            mlBackendAvailable = false;
            break;
          }
          const data = await response.json();
          const largeCaps = (data.large_caps || []).map((c) => ({ ...c, market_cap_category: "large", sector }));
          const midCaps = (data.mid_caps || []).map((c) => ({ ...c, market_cap_category: "mid", sector }));
          const smallCaps = (data.small_caps || []).map((c) => ({ ...c, market_cap_category: "small", sector }));
          console.log(`[${source}] Sector ${sector}: ${largeCaps.length} large, ${midCaps.length} mid, ${smallCaps.length} small caps`);
          allCandidates.push(...largeCaps, ...midCaps, ...smallCaps);
        } catch (error) {
          console.error(`[${source}] Error fetching sector ${sector} from ML backend:`, error);
          mlBackendAvailable = false;
          break;
        }
      }
      if (mlBackendAvailable && allCandidates.length > 0) {
        console.log(`[${source}] Received ${allCandidates.length} total candidates from ML backend`);
        const tickersToAnalyze = allCandidates.map((c) => c.ticker);
        console.log(`[${source}] Analyzing ${tickersToAnalyze.length} total stocks`);
        await storage.deleteAllStockRecommendations();
        const analyzed = await stockAnalyzer.batchAnalyzeStocks(tickersToAnalyze);
        for (const { recommendation } of analyzed) {
          await storage.createStockRecommendation(recommendation);
        }
        await storage.createRefreshLog({
          refreshType: "recommendations",
          status: "success",
          message: `${source}: ${analyzed.length} stocks analyzed across ${sectors.length} sectors (ML backend)`
        });
        console.log(`[${source}] Completed: ${analyzed.length} stocks analyzed`);
        return analyzed.length;
      } else {
        console.log(`[${source}] ML backend not available, using fallback method`);
        throw new Error("ML backend unavailable");
      }
    } catch (error) {
      console.log(`[${source}] Falling back to stock discovery...`);
      const config = getStockConfig();
      let stocks;
      if (useDynamicDiscovery) {
        console.log(`[${source}] Using dynamic stock discovery...`);
        stocks = await stockDiscovery.discoverStocks(config);
      } else {
        console.log(`[${source}] Using curated stock list...`);
        stocks = stockDiscovery.getCuratedStocks(config);
      }
      const allTickers = stocks.allTickers;
      console.log(`[${source}] Analyzing ${allTickers.length} stocks:`, allTickers.join(", "));
      await storage.deleteAllStockRecommendations();
      const analyzed = await stockAnalyzer.batchAnalyzeStocks(allTickers);
      for (const { recommendation } of analyzed) {
        await storage.createStockRecommendation(recommendation);
      }
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "success",
        message: `${source}: ${analyzed.length} stocks analyzed (fallback)`
      });
      console.log(`[${source}] Completed: ${analyzed.length} stocks analyzed (fallback)`);
      return analyzed.length;
    }
  };
  cron.schedule("0 9 * * 1-5", async () => {
    console.log("Starting daily stock recommendations refresh...");
    try {
      await refreshRecommendations("Daily refresh");
    } catch (error) {
      console.error("Error during daily refresh:", error);
      await storage.createRefreshLog({
        refreshType: "recommendations",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error during daily refresh"
      });
    }
  }, {
    timezone: "America/New_York"
  });
  cron.schedule("0 */6 * * *", async () => {
    console.log("Starting 6-hour stock recommendations refresh...");
    try {
      const recommendations = await storage.getAllStockRecommendations();
      if (recommendations.length === 0) {
        await refreshRecommendations("6-hour backup refresh");
      } else {
        console.log("Recommendations already exist, skipping 6-hour refresh");
      }
    } catch (error) {
      console.error("Error during 6-hour refresh:", error);
    }
  });
  console.log("Stock recommendation scheduler initialized");
  console.log("- Daily refresh: 9:00 AM EST (weekdays)");
  console.log("- Backup refresh: Every 6 hours");
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, async () => {
    log(`serving on port ${port}`);
    setupScheduler();
    try {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const existingIPOs = await storage2.getAllUpcomingIPOs();
      if (existingIPOs.length === 0) {
        log("Seeding IPO data...");
        const { ipoService: ipoService2 } = await Promise.resolve().then(() => (init_ipoService(), ipoService_exports));
        const ipos = await ipoService2.fetchUpcomingIPOs();
        for (const ipo of ipos) {
          await storage2.createUpcomingIPO(ipo);
        }
        log(`Seeded ${ipos.length} upcoming IPOs`);
      }
    } catch (error) {
      console.error("Error seeding IPOs:", error);
    }
  });
})();
