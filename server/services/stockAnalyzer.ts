import { yahooFinanceService, type StockData } from "./yahooFinance";
import { groqService, type LLMAnalysis } from "./groqService";
import { newsService, type NewsArticle } from "./newsService";
import { getMLDatabaseService } from "./mlDatabaseService";
import type { InsertStockRecommendation, InsertStockAnalysis } from "@shared/schema";

// Simple concurrency limiter
class ConcurrencyLimiter {
  private running = 0;
  private queue: (() => Promise<any>)[] = [];

  constructor(private limit: number = 5) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// Simple LRU cache for news and Groq responses
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  private maxSize = 100;

  constructor(private ttlMs: number = 30 * 60 * 1000) {} // 30 min default

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    this.cache.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
  }
}

export interface AnalyzedStock {
  recommendation: InsertStockRecommendation;
  news: NewsArticle[];
}

export interface CustomAnalyzedStock {
  analysis: InsertStockAnalysis;
}

export interface Candidate {
  ticker: string;
  name: string;
  sector?: string;
  composite_score: number;
  current_price: number;
  prediction?: { predicted_return: number };
  pe_ratio: number;
  avg_volume: number;
  market_cap: number;
}

export class StockAnalyzer {
  private concurrency = new ConcurrencyLimiter(2); // Reduced to 2 to avoid Yahoo Finance rate limits
  private newsCache = new SimpleCache<NewsArticle[]>(15 * 60 * 1000); // 15 min cache
  private groqCache = new SimpleCache<LLMAnalysis>(30 * 60 * 1000); // 30 min cache
  
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delayMs = initialDelayMs * Math.pow(2, i); // Exponential backoff
          console.log(`  Retry ${i + 1}/${maxRetries - 1} after ${delayMs}ms for error: ${lastError.message}`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw lastError;
  }

  async analyzeStock(ticker: string, candidate?: Candidate): Promise<AnalyzedStock | null> {
    try {
      console.log(`Analyzing ${ticker}...`);
      let stockData;
      let mlBackendScore = null;
      let sector: string | undefined;
      
      // Try ML database first (fastest, no rate limits)
      const mlDb = getMLDatabaseService();
      const mlData = mlDb.getStockData(ticker);
      
      if (mlData) {
        console.log(`  ✓ Using ML database data for ${ticker}`);
        stockData = {
          ticker: mlData.ticker,
          companyName: mlData.name,
          currentPrice: mlData.currentPrice,
          priceChange: mlData.priceChange,
          priceChangePercent: mlData.priceChangePercent,
          pe: mlData.peRatio || 0,
          volume: mlData.avgVolume ? mlData.avgVolume.toLocaleString() : "0",
          institutionalHolding: 0,
          marketCap: mlData.marketCap,
          marketCapFormatted: `$${(mlData.marketCap / 1e9).toFixed(2)}B`,
        };
        sector = mlData.sector;
        mlBackendScore = mlData.compositeScore;
      } else if (candidate && candidate.ticker === ticker.toUpperCase()) {
        // Use provided candidate data directly
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
          marketCapFormatted: `$${(candidate.market_cap / 1e9).toFixed(2)}B`,
        };
        sector = candidate.sector;
      } else {
        // Fallback to Yahoo Finance if no candidate provided
        // (for custom stock analysis or when called individually)
        console.log(`  Fetching from Yahoo Finance (with retry)...`);
        try {
          stockData = await this.retryWithBackoff(
            () => yahooFinanceService.getStockData(ticker),
            3,
            1000
          );
        } catch (e) {
          console.error(`  Failed to fetch data for ${ticker} after retries:`, e);
          return null;
        }
        
        if (!stockData) {
          console.error(`  Could not fetch data for ${ticker}`);
          return null;
        }
      }

      // Fetch company profile for sector (and potentially enrich later). Cache simple to avoid duplicate calls.
      if (!sector) {
        try {
          const profile = await this.retryWithBackoff(
            () => yahooFinanceService.getCompanyProfile(ticker),
            2,
            1000
          );
          sector = profile?.sector;
        } catch (e) {
          console.log(`  Sector lookup failed for ${ticker}:`, e instanceof Error ? e.message : String(e));
        }
      }
      if (!sector) sector = 'Unknown';

      // Use cached news if available
      let news = this.newsCache.get(`news_${ticker}`);
      if (!news) {
        try {
          news = await newsService.getStockNews(ticker);
          this.newsCache.set(`news_${ticker}`, news);
        } catch (e) {
          console.warn(`Failed to fetch news for ${ticker}:`, e);
          news = [];
        }
      }
      
      const newsContext = newsService.getNewsContext(news);
      const sentimentScore = newsService.calculateSentimentScore(news);
      const sentiment = newsService.getSentimentLabel(sentimentScore);

      // Use cached LLM analysis if available
      const groqCacheKey = `groq_${ticker}_${stockData.pe || 0}_${stockData.currentPrice || 0}`;
      let llmAnalysis = this.groqCache.get(groqCacheKey);
      
      if (!llmAnalysis) {
        try {
          llmAnalysis = await groqService.analyzeStock(
            ticker,
            stockData.companyName,
            stockData.currentPrice,
            stockData.priceChangePercent,
            stockData.pe,
            stockData.marketCapFormatted,
            newsContext
          );
          this.groqCache.set(groqCacheKey, llmAnalysis);
        } catch (e) {
          console.warn(`Failed to get LLM analysis for ${ticker}:`, e);
          return null;
        }
      }

      // Use ML backend score if available, otherwise calculate with heuristics
      const mlScore = mlBackendScore !== null 
        ? Math.round(mlBackendScore) 
        : this.calculateMLScore(stockData, sentimentScore);
      const llmScore = llmAnalysis.confidenceScore;

      const hybridScore = Math.round(mlScore * 0.6 + llmScore * 0.4);

      const marketCapCategory = yahooFinanceService.getMarketCapCategory(stockData.marketCap);

      const recommendation: InsertStockRecommendation = {
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
        llmScore,
      };

      return {
        recommendation,
        news,
      };
    } catch (error) {
      console.error(`Error analyzing stock ${ticker}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async analyzeCustomStock(ticker: string, candidate?: Candidate): Promise<CustomAnalyzedStock | null> {
    try {
      console.log(`Analyzing custom stock ${ticker}...`);
      let stockData;
      let mlBackendScore = null;
      let sector: string | undefined;
      
      // Try ML database first
      const mlDb = getMLDatabaseService();
      const mlData = mlDb.getStockData(ticker);
      
      if (mlData) {
        console.log(`  ✓ Using ML database data for custom stock ${ticker}`);
        stockData = {
          ticker: mlData.ticker,
          companyName: mlData.name,
          currentPrice: mlData.currentPrice,
          priceChange: mlData.priceChange,
          priceChangePercent: mlData.priceChangePercent,
          pe: mlData.peRatio || 0,
          volume: mlData.avgVolume ? mlData.avgVolume.toLocaleString() : "0",
          institutionalHolding: 0,
          marketCap: mlData.marketCap,
          marketCapFormatted: `$${(mlData.marketCap / 1e9).toFixed(2)}B`,
        };
        sector = mlData.sector;
        mlBackendScore = mlData.compositeScore;
      } else if (candidate) {
        // Use ML candidate data and composite score
        mlBackendScore = candidate.composite_score || null;
        stockData = {
          ticker: candidate.ticker,
          companyName: candidate.name || candidate.ticker,
          currentPrice: candidate.current_price || 0,
          priceChange: 0, // Calculate from prediction if needed
          priceChangePercent: candidate.prediction?.predicted_return || 0,
          pe: candidate.pe_ratio || 0,
          volume: candidate.avg_volume ? candidate.avg_volume.toLocaleString() : "0",
          institutionalHolding: 0,
          marketCap: candidate.market_cap || 0,
          marketCapFormatted: `$${(candidate.market_cap / 1e9).toFixed(2)}B`,
        };
        sector = candidate.sector;
      } else {
        // Fallback to Yahoo Finance
        console.log(`  Fetching custom stock from Yahoo Finance (with retry)...`);
        try {
          stockData = await this.retryWithBackoff(
            () => yahooFinanceService.getStockData(ticker),
            3,
            1000
          );
        } catch (e) {
          console.error(`  Failed to fetch custom stock ${ticker} after retries:`, e);
          return null;
        }
        
        if (!stockData) {
          console.error(`  Could not fetch data for custom stock ${ticker}`);
          return null;
        }
      }

      // Use cached news if available
      let news = this.newsCache.get(`news_${ticker}`);
      if (!news) {
        try {
          news = await newsService.getStockNews(ticker);
          this.newsCache.set(`news_${ticker}`, news);
        } catch (e) {
          console.warn(`Failed to fetch news for custom stock ${ticker}:`, e);
          news = [];
        }
      }
      
      const newsContext = newsService.getNewsContext(news);
      const sentimentScore = newsService.calculateSentimentScore(news);
      const sentiment = newsService.getSentimentLabel(sentimentScore);

      // Fetch company profile for business summary
      let companyProfile;
      let businessSummary = null;
      
      if (!sector) {
        try {
          companyProfile = await this.retryWithBackoff(
            () => yahooFinanceService.getCompanyProfile(ticker),
            2,
            1000
          );
          businessSummary = companyProfile?.businessSummary || null;
          sector = companyProfile?.sector || 'Unknown';
        } catch (e) {
          console.log(`  Company profile lookup failed for custom stock ${ticker}`);
          sector = 'Unknown';
        }
      }

      // Use cached LLM analysis if available
      const groqCacheKey = `groq_custom_${ticker}_${stockData.pe || 0}_${stockData.currentPrice || 0}`;
      let llmAnalysis = this.groqCache.get(groqCacheKey);
      
      if (!llmAnalysis) {
        try {
          llmAnalysis = await groqService.analyzeStock(
            ticker,
            stockData.companyName,
            stockData.currentPrice,
            stockData.priceChangePercent,
            stockData.pe,
            stockData.marketCapFormatted,
            newsContext
          );
          this.groqCache.set(groqCacheKey, llmAnalysis);
        } catch (e) {
          console.warn(`Failed to get LLM analysis for custom stock ${ticker}:`, e);
          return null;
        }
      }

      // Use ML backend score if available, otherwise calculate with heuristics
      const mlScore = mlBackendScore !== null 
        ? Math.round(mlBackendScore) 
        : this.calculateMLScore(stockData, sentimentScore);
      const llmScore = llmAnalysis.confidenceScore;
      const hybridScore = Math.round(mlScore * 0.6 + llmScore * 0.4);

      const aiInsights = `${stockData.companyName} analysis:

**Recommendation**: ${llmAnalysis.signal} with ${hybridScore}% confidence

**AI Reasoning**: ${llmAnalysis.reasoning}

**Technical Overview**: ${llmAnalysis.technicalAnalysis}

**Sentiment Analysis**: News sentiment is ${sentiment} (${(sentimentScore * 100).toFixed(0)}% positive) based on recent coverage.

**Hybrid Score**: The combined ML model (${mlScore}/100) and LLM analysis (${llmScore}/100) produces a ${hybridScore}/100 confidence score.`;

      const analysis: InsertStockAnalysis = {
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
        news: news as any,
        mlScore,
        llmScore,
      };

      return { analysis };
    } catch (error) {
      console.error(`Error analyzing custom stock ${ticker}:`, error);
      return null;
    }
  }

  async batchAnalyzeStocks(tickers: string[]): Promise<AnalyzedStock[]> {
    console.log(`Starting batch analysis of ${tickers.length} stocks with concurrency limit of 5...`);
    
    // Analyze each ticker with concurrency limit (max 5 parallel)
    const promises = tickers.map((ticker) => 
      this.concurrency.run(() => this.analyzeStock(ticker, undefined))
    );
    
    const results = await Promise.all(promises);
    const successful = results.filter((result): result is AnalyzedStock => result !== null);
    console.log(`✓ Completed batch analysis: ${successful.length}/${tickers.length} successful`);
    return successful;
  }

  async batchAnalyzeStocksAsync(
    tickers: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<AnalyzedStock[]> {
    console.log(`Starting async batch analysis of ${tickers.length} stocks...`);
    const results: AnalyzedStock[] = [];
    
    // Process in chunks with progress reporting
    const chunkSize = 10;
    for (let i = 0; i < tickers.length; i += chunkSize) {
      const chunk = tickers.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map((ticker) => 
          this.concurrency.run(() => this.analyzeStock(ticker, undefined))
        )
      );
      
      for (const result of chunkResults) {
        if (result) results.push(result);
      }
      
      const completed = Math.min(i + chunkSize, tickers.length);
      onProgress?.(completed, tickers.length);
      console.log(`Progress: ${completed}/${tickers.length} stocks analyzed`);
    }
    
    console.log(`✓ Completed async analysis: ${results.length}/${tickers.length} successful`);
    return results;
  }


  private calculateMLScore(stockData: StockData, sentimentScore: number): number {
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

  private determineSignal(
    confidenceScore: number,
    llmSignal: "BUY" | "HOLD" | "SELL"
  ): "BUY" | "HOLD" | "SELL" {
    if (confidenceScore >= 75 && llmSignal === "BUY") return "BUY";
    if (confidenceScore >= 70 && llmSignal === "BUY") return "BUY";
    if (confidenceScore <= 40 && llmSignal === "SELL") return "SELL";
    if (confidenceScore <= 45 && llmSignal === "SELL") return "SELL";
    return "HOLD";
  }
}

export const stockAnalyzer = new StockAnalyzer();
