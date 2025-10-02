import { useState } from "react";
import { StockCard } from "@/components/StockCard";
import { MarketIndicator } from "@/components/MarketIndicator";
import { StockDetailModal } from "@/components/StockDetailModal";
import { Activity, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const mockStocks = [
    {
      ticker: "NVDA",
      companyName: "NVIDIA Corporation",
      currentPrice: 495.22,
      priceChange: 12.45,
      priceChangePercent: 2.58,
      confidenceScore: 92,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.85,
      pe: 62.3,
      volume: "48.2M",
      institutionalHolding: 68.5,
      aiReasoning: "Strong AI chip demand and dominant GPU market position. Recent earnings beat by 15%.",
    },
    {
      ticker: "AAPL",
      companyName: "Apple Inc.",
      currentPrice: 182.45,
      priceChange: 3.24,
      priceChangePercent: 1.81,
      confidenceScore: 87,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.78,
      pe: 28.5,
      volume: "52.3M",
      institutionalHolding: 62.4,
      aiReasoning: "Growing services revenue and positive sentiment from product launches.",
    },
    {
      ticker: "MSFT",
      companyName: "Microsoft Corporation",
      currentPrice: 410.80,
      priceChange: 8.50,
      priceChangePercent: 2.11,
      confidenceScore: 89,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.82,
      pe: 35.2,
      volume: "28.5M",
      institutionalHolding: 73.1,
      aiReasoning: "Cloud growth acceleration and AI integration driving revenue expansion.",
    },
    {
      ticker: "GOOGL",
      companyName: "Alphabet Inc.",
      currentPrice: 145.20,
      priceChange: 2.15,
      priceChangePercent: 1.50,
      confidenceScore: 84,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.74,
      pe: 24.8,
      volume: "31.2M",
      institutionalHolding: 65.8,
      aiReasoning: "Search dominance and growing cloud market share with AI investments.",
    },
    {
      ticker: "META",
      companyName: "Meta Platforms Inc.",
      currentPrice: 398.50,
      priceChange: -2.30,
      priceChangePercent: -0.57,
      confidenceScore: 78,
      signal: "HOLD" as const,
      sentiment: "neutral" as const,
      sentimentScore: 0.52,
      pe: 31.5,
      volume: "19.8M",
      institutionalHolding: 58.3,
      aiReasoning: "Mixed signals from metaverse investments but strong ad revenue recovery.",
    },
    {
      ticker: "TSLA",
      companyName: "Tesla Inc.",
      currentPrice: 238.45,
      priceChange: 5.80,
      priceChangePercent: 2.49,
      confidenceScore: 76,
      signal: "HOLD" as const,
      sentiment: "neutral" as const,
      sentimentScore: 0.61,
      pe: 68.4,
      volume: "124.5M",
      institutionalHolding: 44.2,
      aiReasoning: "High valuation concerns offset by strong delivery numbers and energy growth.",
    },
  ];

  const mockNews = [
    {
      title: "NVIDIA Announces Next-Gen AI Chips with 40% Performance Boost",
      source: "TechCrunch",
      date: "2 hours ago",
      sentiment: "positive" as const,
      url: "#",
    },
    {
      title: "Major Cloud Providers Increase NVIDIA GPU Orders",
      source: "Reuters",
      date: "5 hours ago",
      sentiment: "positive" as const,
      url: "#",
    },
    {
      title: "Analysts Raise Price Target Following Strong Q4 Results",
      source: "Bloomberg",
      date: "1 day ago",
      sentiment: "positive" as const,
      url: "#",
    },
  ];

  const selectedStockData = mockStocks.find(s => s.ticker === selectedStock);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold" data-testid="text-dashboard-title">Today's Top Recommendations</h1>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          <p className="text-muted-foreground">
            AI-powered stock analysis combining CatBoost ML, FinBERT sentiment, and Groq LLM insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MarketIndicator
            label="S&P 500"
            value="4,783.45"
            change={12.34}
            changePercent={0.26}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MarketIndicator
            label="Market Sentiment"
            value="Bullish"
            change={0.08}
            changePercent={5.2}
            icon={<Activity className="w-4 h-4" />}
          />
          <MarketIndicator
            label="VIX"
            value="13.24"
            change={-0.42}
            changePercent={-3.08}
            icon={<AlertCircle className="w-4 h-4" />}
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Top 10 Stock Picks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockStocks.map((stock) => (
              <StockCard
                key={stock.ticker}
                {...stock}
                onViewDetails={() => setSelectedStock(stock.ticker)}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedStockData && (
        <StockDetailModal
          open={!!selectedStock}
          onOpenChange={(open) => !open && setSelectedStock(null)}
          ticker={selectedStockData.ticker}
          companyName={selectedStockData.companyName}
          currentPrice={selectedStockData.currentPrice}
          priceChange={selectedStockData.priceChange}
          priceChangePercent={selectedStockData.priceChangePercent}
          signal={selectedStockData.signal}
          aiInsights={`${selectedStockData.companyName} shows exceptional growth potential. The CatBoost model rates this stock at ${selectedStockData.confidenceScore}/100 based on technical indicators, while FinBERT analysis shows ${(selectedStockData.sentimentScore * 100).toFixed(0)}% positive sentiment from recent news coverage.`}
          technicalAnalysis="The stock is trading above all major moving averages, indicating strong upward momentum. RSI suggests room for growth. Volume analysis reveals consistent buying pressure from institutional investors."
          news={mockNews}
        />
      )}
    </div>
  );
}
