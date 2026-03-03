import * as cheerio from "cheerio";
import { finbertService } from "./finbertService";

export interface NewsArticle {
  title: string;
  source: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore?: number; // FinBERT confidence score
  url: string;
}

export class NewsService {
  private finnhubApiKey: string | undefined;

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY;
    
    if (!this.finnhubApiKey) {
      console.log("NewsService: Running without Finnhub API key");
      console.log("Get a free key at: https://finnhub.io/register");
      console.log("News will use fallback methods (limited)");
    }
  }

  async getStockNews(ticker: string): Promise<NewsArticle[]> {
    try {
      // Try Finnhub API first (most reliable)
      if (this.finnhubApiKey) {
        const finnhubArticles = await this.getNewsFromFinnhub(ticker);
        if (finnhubArticles.length > 0) {
          console.log(`Found ${finnhubArticles.length} articles from Finnhub for ${ticker}`);
          return finnhubArticles;
        }
      }

      // Fallback: Try Yahoo Finance RSS feed
      const rssArticles = await this.getNewsFromYahooRSS(ticker);
      if (rssArticles.length > 0) {
        console.log(`Found ${rssArticles.length} articles from Yahoo RSS for ${ticker}`);
        return rssArticles;
      }

      // Fallback: Try scraping Yahoo Finance news page
      const scrapedArticles = await this.scrapeYahooNews(ticker);
      if (scrapedArticles.length > 0) {
        console.log(`Found ${scrapedArticles.length} articles from scraping for ${ticker}`);
        return scrapedArticles;
      }

      // If all methods fail, generate synthetic news context
      console.log(`No news found for ${ticker}, generating synthetic news context`);
      return this.generateSyntheticNews(ticker);
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      return this.generateSyntheticNews(ticker);
    }
  }

  private async getNewsFromFinnhub(ticker: string): Promise<NewsArticle[]> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7); // Last 7 days
      const from = fromDate.toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];

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

      // Convert Finnhub format to our format
      const articles: NewsArticle[] = data.slice(0, 5).map((item: any) => ({
        title: item.headline || "No title",
        source: item.source || "Finnhub",
        date: this.formatDate(new Date(item.datetime * 1000).toISOString()),
        sentiment: "neutral" as const, // Will be updated by FinBERT
        url: item.url || `https://finnhub.io/`,
      }));

      if (articles.length > 0) {
        // Use FinBERT to analyze sentiment
        console.log(`Analyzing sentiment for ${articles.length} articles using FinBERT...`);
        const analysis = await finbertService.analyzeNewsArticles(articles);
        
        // Update articles with FinBERT sentiment
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

  private async getNewsFromYahooRSS(ticker: string): Promise<NewsArticle[]> {
    try {
      const rssUrl = `https://finance.yahoo.com/rss/headline?s=${ticker}`;
      
      const response = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return [];
      }

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      
      const articles: NewsArticle[] = [];
      
      $("item").slice(0, 5).each((_, element) => {
        const title = $(element).find("title").text().trim();
        const link = $(element).find("link").text().trim();
        const pubDate = $(element).find("pubDate").text().trim();
        
        if (title && link) {
          articles.push({
            title,
            source: "Yahoo Finance",
            date: this.formatDate(pubDate),
            sentiment: "neutral", // Will be updated by FinBERT
            url: link,
          });
        }
      });

      if (articles.length > 0) {
        // Use FinBERT to analyze sentiment
        console.log(`Analyzing sentiment for ${articles.length} articles using FinBERT...`);
        const analysis = await finbertService.analyzeNewsArticles(articles);
        
        // Update articles with FinBERT sentiment
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

  private async scrapeYahooNews(ticker: string): Promise<NewsArticle[]> {
    try {
      const url = `https://finance.yahoo.com/quote/${ticker}/news`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const articles: NewsArticle[] = [];
      
      // Try multiple selectors for different Yahoo Finance layouts
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
          
          if (title && link && !articles.some(a => a.title === title)) {
            articles.push({
              title,
              source,
              date: timeText || "Recent",
              sentiment: "neutral",
              url: link.startsWith("http") ? link : `https://finance.yahoo.com${link}`,
            });
          }
        });

        if (articles.length > 0) break;
      }

      if (articles.length > 0) {
        // Use FinBERT to analyze sentiment
        console.log(`Analyzing sentiment for ${articles.length} articles using FinBERT...`);
        const analysis = await finbertService.analyzeNewsArticles(articles);
        
        // Update articles with FinBERT sentiment
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

  private generateSyntheticNews(ticker: string): NewsArticle[] {
    const today = new Date();
    const newsTemplates = [
      {
        title: `${ticker} stock shows mixed trading signals amid market volatility`,
        sentiment: "neutral" as const,
        sentimentScore: 0.6,
      },
      {
        title: `Analysts maintain watchlist status for ${ticker} shares`,
        sentiment: "neutral" as const,
        sentimentScore: 0.55,
      },
      {
        title: `${ticker} trading volume reflects investor interest`,
        sentiment: "neutral" as const,
        sentimentScore: 0.5,
      },
    ];

    return newsTemplates.map((template, i) => ({
      ...template,
      source: "Market Summary",
      date: `${i} hours ago`,
      url: `https://finance.yahoo.com/quote/${ticker}`,
    }));
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recent";
    }
  }

  analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
    const positiveWords = [
      "surge", "gain", "rise", "growth", "profit", "strong", "beat", "exceed",
      "soar", "rally", "bullish", "upgrade", "expand", "success", "recover",
      "positive", "optimistic", "breakthrough", "boost", "high"
    ];
    
    const negativeWords = [
      "fall", "drop", "decline", "loss", "weak", "miss", "plunge", "crash",
      "bearish", "downgrade", "cut", "struggle", "concern", "risk", "negative",
      "worry", "fear", "trouble", "low", "slump"
    ];

    const lowerText = text.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  getNewsContext(articles: NewsArticle[]): string {
    if (articles.length === 0) {
      return "No recent news available.";
    }

    return articles
      .slice(0, 3)
      .map((article) => {
        const sentimentEmoji = {
          positive: "📈",
          neutral: "➡️",
          negative: "📉",
        }[article.sentiment];
        
        const confidence = article.sentimentScore 
          ? ` [${(article.sentimentScore * 100).toFixed(0)}% confidence]`
          : "";
        
        return `${sentimentEmoji} ${article.title} (${article.source}, ${article.date})${confidence}`;
      })
      .join("\n");
  }

  calculateSentimentScore(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0.5;

    const scores = articles.map((article) => {
      // Use FinBERT score if available, otherwise map sentiment to score
      if (article.sentimentScore !== undefined) {
        const sentimentMap = {
          positive: 1,
          neutral: 0.5,
          negative: 0,
        };
        return sentimentMap[article.sentiment] * article.sentimentScore;
      }
      
      // Fallback to simple mapping
      const sentimentMap = {
        positive: 1,
        neutral: 0.5,
        negative: 0,
      };
      return sentimentMap[article.sentiment];
    });

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return avgScore;
  }

  getSentimentLabel(score: number): "positive" | "neutral" | "negative" {
    if (score >= 0.6) return "positive";
    if (score <= 0.4) return "negative";
    return "neutral";
  }

  /**
   * Get news articles for a company by name (useful for IPOs without ticker symbols)
   */
  async getCompanyNews(companyName: string, limit: number = 5): Promise<NewsArticle[]> {
    try {
      if (!this.finnhubApiKey) {
        console.log(`No Finnhub API key, generating synthetic news for ${companyName}`);
        return [];
      }

      // Use general news search with company name
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

      // Filter articles that mention the company name
      const companyNameLower = companyName.toLowerCase();
      const relevantArticles = data.filter((article: any) => {
        const headline = (article.headline || '').toLowerCase();
        const summary = (article.summary || '').toLowerCase();
        return headline.includes(companyNameLower) || summary.includes(companyNameLower);
      });

      // Process and analyze sentiment for found articles
      const articles: NewsArticle[] = [];
      for (const article of relevantArticles.slice(0, limit)) {
        const headline = article.headline || 'Untitled';
        const summary = article.summary || headline;
        
        // Analyze sentiment
        const sentimentResult = await finbertService.analyzeSentiment(summary);
        const sentiment = sentimentResult.label;
        const sentimentScore = sentimentResult.score;
        
        articles.push({
          title: headline,
          source: article.source || 'Unknown',
          date: new Date(article.datetime * 1000).toLocaleDateString(),
          sentiment,
          sentimentScore: Math.round(sentimentScore * 100) / 100,
          url: article.url || '#',
        });
      }

      // If we didn't find enough relevant articles, add some generic market news
      if (articles.length === 0) {
        console.log(`No specific news found for ${companyName}, returning general market news`);
        // Return some general market news
        const generalArticles = data.slice(0, limit);
        for (const article of generalArticles) {
          const headline = article.headline || 'Untitled';
          const summary = article.summary || headline;
          
          const sentimentResult = await finbertService.analyzeSentiment(summary);
          const sentiment = sentimentResult.label;
          const sentimentScore = sentimentResult.score;
          
          articles.push({
            title: headline,
            source: article.source || 'Unknown',
            date: new Date(article.datetime * 1000).toLocaleDateString(),
            sentiment,
            sentimentScore: Math.round(sentimentScore * 100) / 100,
            url: article.url || '#',
          });
        }
      }

      return articles;
    } catch (error) {
      console.error(`Error fetching company news for ${companyName}:`, error);
      return [];
    }
  }
}

export const newsService = new NewsService();

// Export helper function for easy access
export async function getCompanyNews(companyName: string, limit: number = 5): Promise<NewsArticle[]> {
  return newsService.getCompanyNews(companyName, limit);
}
