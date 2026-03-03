export interface FinBERTSentiment {
  label: "positive" | "neutral" | "negative";
  score: number; // Confidence score 0-1
}

export interface FinBERTAnalysis {
  overallSentiment: "positive" | "neutral" | "negative";
  overallScore: number; // 0-1 where 0=very negative, 1=very positive
  articleSentiments: Array<{
    title: string;
    sentiment: FinBERTSentiment;
  }>;
}

export class FinBERTService {
  private apiUrl = "https://api-inference.huggingface.co/models/ProsusAI/finbert";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    
    // HuggingFace has a free inference API, but rate limited without key
    if (!this.apiKey) {
      console.log("FinBERT: Running without HuggingFace API key (rate limited)");
      console.log("Get a free key at: https://huggingface.co/settings/tokens");
    }
  }

  async analyzeSentiment(text: string): Promise<FinBERTSentiment> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          // Model is loading, wait and retry once
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.analyzeSentiment(text);
        }
        throw new Error(`FinBERT API error: ${response.status}`);
      }

      const results = await response.json();
      
      // FinBERT returns array of label/score pairs
      // Format: [[{label: "positive", score: 0.95}, {label: "negative", score: 0.03}, ...]]
      const predictions = results[0];
      
      // Find the highest scoring label
      const topPrediction = predictions.reduce((max: any, curr: any) => 
        curr.score > max.score ? curr : max
      );

      return {
        label: topPrediction.label as "positive" | "neutral" | "negative",
        score: topPrediction.score,
      };
    } catch (error) {
      console.error("Error calling FinBERT API:", error);
      
      // Fallback to keyword-based if API fails
      return this.fallbackSentiment(text);
    }
  }

  async analyzeMultipleTexts(texts: string[]): Promise<FinBERTAnalysis> {
    const sentiments = await Promise.all(
      texts.map(text => this.analyzeSentiment(text))
    );

    // Calculate overall sentiment
    let totalScore = 0;
    const sentimentMap: { [key: string]: number } = {
      positive: 1,
      neutral: 0.5,
      negative: 0,
    };

    sentiments.forEach(s => {
      totalScore += sentimentMap[s.label] * s.score;
    });

    const avgScore = sentiments.length > 0 ? totalScore / sentiments.length : 0.5;
    
    let overallSentiment: "positive" | "neutral" | "negative";
    if (avgScore > 0.6) overallSentiment = "positive";
    else if (avgScore < 0.4) overallSentiment = "negative";
    else overallSentiment = "neutral";

    return {
      overallSentiment,
      overallScore: avgScore,
      articleSentiments: texts.map((text, i) => ({
        title: text,
        sentiment: sentiments[i],
      })),
    };
  }

  async analyzeNewsArticles(articles: Array<{ title: string }>): Promise<FinBERTAnalysis> {
    if (articles.length === 0) {
      return {
        overallSentiment: "neutral",
        overallScore: 0.5,
        articleSentiments: [],
      };
    }

    // Analyze just the titles (most impactful for sentiment)
    const titles = articles.map(a => a.title);
    return this.analyzeMultipleTexts(titles);
  }

  private fallbackSentiment(text: string): FinBERTSentiment {
    const positiveWords = [
      "surge", "gain", "rise", "growth", "profit", "strong", "beat", "exceed",
      "soar", "rally", "bullish", "upgrade", "expand", "success", "recover",
      "positive", "optimistic", "breakthrough", "boost", "high", "up"
    ];
    
    const negativeWords = [
      "fall", "drop", "decline", "loss", "weak", "miss", "plunge", "crash",
      "bearish", "downgrade", "cut", "struggle", "concern", "risk", "negative",
      "worry", "fear", "trouble", "low", "slump", "down"
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

    if (positiveCount > negativeCount) {
      return { label: "positive", score: 0.7 };
    }
    if (negativeCount > positiveCount) {
      return { label: "negative", score: 0.7 };
    }
    return { label: "neutral", score: 0.6 };
  }
}

export const finbertService = new FinBERTService();
