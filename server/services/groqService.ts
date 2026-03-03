import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface LLMAnalysis {
  signal: "BUY" | "HOLD" | "SELL";
  confidenceScore: number;
  reasoning: string;
  technicalAnalysis: string;
}

export class GroqService {
  async analyzeStock(
    ticker: string,
    companyName: string,
    currentPrice: number,
    priceChangePercent: number,
    pe: number,
    marketCap: string,
    newsContext: string
  ): Promise<LLMAnalysis> {
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
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from Groq API");
      }

      const analysis = JSON.parse(content) as LLMAnalysis;
      
      return {
        signal: analysis.signal || "HOLD",
        confidenceScore: Math.min(100, Math.max(0, analysis.confidenceScore || 50)),
        reasoning: analysis.reasoning || "Analysis unavailable",
        technicalAnalysis: analysis.technicalAnalysis || "Technical analysis unavailable",
      };
    } catch (error) {
      console.error(`Error analyzing stock ${ticker} with Groq:`, error);
      
      return {
        signal: "HOLD",
        confidenceScore: 50,
        reasoning: "Unable to perform LLM analysis at this time.",
        technicalAnalysis: "Technical analysis unavailable due to API error.",
      };
    }
  }

  async batchAnalyzeStocks(
    stocks: Array<{
      ticker: string;
      companyName: string;
      currentPrice: number;
      priceChangePercent: number;
      pe: number;
      marketCap: string;
      newsContext: string;
    }>
  ): Promise<LLMAnalysis[]> {
    const promises = stocks.map((stock) =>
      this.analyzeStock(
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

  async analyzeIPO(
    companyName: string,
    ticker: string,
    sector: string,
    expectedValuation: string,
    priceRange: string,
    ipoDate: string,
    news: Array<{ title: string; source: string; sentiment: string }>
  ): Promise<string> {
    try {
      const newsContext = news.length > 0
        ? news.map(n => `- ${n.title} (${n.source}, ${n.sentiment})`).join('\n')
        : 'No recent news available';

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
        max_tokens: 800,
      });

      return completion.choices[0]?.message?.content || "Analysis unavailable";
    } catch (error) {
      console.error("Error in Groq IPO analysis:", error);
      return `Unable to generate detailed analysis at this time. Please review the company information and recent news to make your investment decision.`;
    }
  }
}

export const groqService = new GroqService();

// Export helper function
export async function analyzeIPO(
  companyName: string,
  ticker: string,
  sector: string,
  expectedValuation: string,
  priceRange: string,
  ipoDate: string,
  news: Array<{ title: string; source: string; sentiment: string }>
): Promise<string> {
  return groqService.analyzeIPO(companyName, ticker, sector, expectedValuation, priceRange, ipoDate, news);
}
