import { yahooFinanceService, type StockData } from "./yahooFinance";
import { groqService, type LLMAnalysis } from "./groqService";
import { newsService, type NewsArticle } from "./newsService";
import type { InsertStockRecommendation, InsertStockAnalysis } from "@shared/schema";

export interface AnalyzedStock {
  recommendation: InsertStockRecommendation;
  news: NewsArticle[];
}

export interface CustomAnalyzedStock {
  analysis: InsertStockAnalysis;
}

export class StockAnalyzer {
  async analyzeStock(ticker: string): Promise<AnalyzedStock | null> {
    try {
      const stockData = await yahooFinanceService.getStockData(ticker);
      if (!stockData) {
        console.error(`Could not fetch data for ${ticker}`);
        return null;
      }

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

      const mlScore = this.calculateMLScore(stockData, sentimentScore);
      const llmScore = llmAnalysis.confidenceScore;

      const hybridScore = Math.round(mlScore * 0.6 + llmScore * 0.4);

      const marketCapCategory = yahooFinanceService.getMarketCapCategory(stockData.marketCap);

      const recommendation: InsertStockRecommendation = {
        ticker: stockData.ticker,
        companyName: stockData.companyName,
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
      console.error(`Error analyzing stock ${ticker}:`, error);
      return null;
    }
  }

  async analyzeCustomStock(ticker: string): Promise<CustomAnalyzedStock | null> {
    try {
      const stockData = await yahooFinanceService.getStockData(ticker);
      if (!stockData) {
        console.error(`Could not fetch data for ${ticker}`);
        return null;
      }

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

      const mlScore = this.calculateMLScore(stockData, sentimentScore);
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
    const promises = tickers.map((ticker) => this.analyzeStock(ticker));
    const results = await Promise.all(promises);
    return results.filter((result): result is AnalyzedStock => result !== null);
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
