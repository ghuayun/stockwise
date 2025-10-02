import * as cheerio from "cheerio";

export interface NewsArticle {
  title: string;
  source: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  url: string;
}

export class NewsService {
  async getStockNews(ticker: string): Promise<NewsArticle[]> {
    try {
      const url = `https://finance.yahoo.com/quote/${ticker}/news`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch news for ${ticker}: ${response.status}`);
        return [];
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const articles: NewsArticle[] = [];
      
      $("li.stream-item").slice(0, 5).each((_, element) => {
        const title = $(element).find("h3").text().trim();
        const source = $(element).find("span.provider-name").text().trim() || "Yahoo Finance";
        const timeText = $(element).find("time").text().trim();
        const link = $(element).find("a").attr("href");
        
        if (title && link) {
          articles.push({
            title,
            source,
            date: timeText || "Recent",
            sentiment: this.analyzeSentiment(title),
            url: link.startsWith("http") ? link : `https://finance.yahoo.com${link}`,
          });
        }
      });

      if (articles.length === 0) {
        console.log(`No news articles found for ${ticker}`);
        return [];
      }

      return articles;
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      return [];
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
      .map((article) => `- ${article.title} (${article.source}, ${article.date})`)
      .join("\n");
  }

  calculateSentimentScore(articles: NewsArticle[]): number {
    if (articles.length === 0) return 0.5;

    const sentimentScores = {
      positive: 1,
      neutral: 0.5,
      negative: 0,
    };

    const totalScore = articles.reduce(
      (sum, article) => sum + sentimentScores[article.sentiment],
      0
    );

    return totalScore / articles.length;
  }

  getSentimentLabel(score: number): "positive" | "neutral" | "negative" {
    if (score >= 0.6) return "positive";
    if (score <= 0.4) return "negative";
    return "neutral";
  }
}

export const newsService = new NewsService();
