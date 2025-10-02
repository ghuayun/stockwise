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
}

export const groqService = new GroqService();
