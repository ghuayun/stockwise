import { useState } from "react";
import { StockListItem } from "@/components/StockListItem";
import { MarketIndicator } from "@/components/MarketIndicator";
import { StockDetailModal } from "@/components/StockDetailModal";
import { StockAnalysisSearch } from "@/components/StockAnalysisSearch";
import { UpcomingIPOCard } from "@/components/UpcomingIPOCard";
import { Activity, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  const largeCaps = [
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
      marketCap: "$2.8T",
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
      marketCap: "$3.1T",
      aiReasoning: "Cloud growth acceleration and AI integration driving revenue expansion.",
    },
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
      marketCap: "$1.2T",
      aiReasoning: "Strong AI chip demand and dominant GPU market position.",
    },
  ];

  const midCaps = [
    {
      ticker: "PLTR",
      companyName: "Palantir Technologies",
      currentPrice: 28.45,
      priceChange: 1.24,
      priceChangePercent: 4.56,
      confidenceScore: 81,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.72,
      pe: 85.4,
      volume: "42.1M",
      institutionalHolding: 45.2,
      marketCap: "$62.5B",
      aiReasoning: "AI platform adoption accelerating with government and enterprise contracts.",
    },
    {
      ticker: "SNOW",
      companyName: "Snowflake Inc.",
      currentPrice: 198.50,
      priceChange: 5.80,
      priceChangePercent: 3.01,
      confidenceScore: 79,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.68,
      pe: 0,
      volume: "5.8M",
      institutionalHolding: 72.8,
      marketCap: "$68.2B",
      aiReasoning: "Cloud data platform showing strong customer growth and expansion.",
    },
    {
      ticker: "CRWD",
      companyName: "CrowdStrike Holdings",
      currentPrice: 298.35,
      priceChange: 8.20,
      priceChangePercent: 2.83,
      confidenceScore: 84,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.76,
      pe: 96.2,
      volume: "3.2M",
      institutionalHolding: 68.9,
      marketCap: "$72.1B",
      aiReasoning: "Cybersecurity leader with AI-powered threat detection expanding market share.",
    },
  ];

  const smallCaps = [
    {
      ticker: "IONQ",
      companyName: "IonQ Inc.",
      currentPrice: 18.92,
      priceChange: 2.15,
      priceChangePercent: 12.81,
      confidenceScore: 74,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.71,
      pe: 0,
      volume: "8.5M",
      institutionalHolding: 38.4,
      marketCap: "$3.8B",
      aiReasoning: "Quantum computing pioneer with recent government contracts and partnerships.",
    },
    {
      ticker: "RXRX",
      companyName: "Recursion Pharmaceuticals",
      currentPrice: 8.45,
      priceChange: 0.52,
      priceChangePercent: 6.56,
      confidenceScore: 71,
      signal: "HOLD" as const,
      sentiment: "neutral" as const,
      sentimentScore: 0.58,
      pe: 0,
      volume: "4.2M",
      institutionalHolding: 52.1,
      marketCap: "$2.1B",
      aiReasoning: "AI drug discovery platform showing promising pipeline development.",
    },
    {
      ticker: "RKLB",
      companyName: "Rocket Lab USA",
      currentPrice: 12.34,
      priceChange: 0.89,
      priceChangePercent: 7.78,
      confidenceScore: 76,
      signal: "BUY" as const,
      sentiment: "positive" as const,
      sentimentScore: 0.69,
      pe: 0,
      volume: "12.8M",
      institutionalHolding: 41.5,
      marketCap: "$5.9B",
      aiReasoning: "Space launch provider with increasing mission cadence and satellite services.",
    },
  ];

  const upcomingIPOs = [
    {
      companyName: "Stripe Inc.",
      ticker: "STRP",
      ipoDate: "March 2025",
      priceRange: "$35-$42",
      expectedValuation: "$65B",
      sector: "Fintech",
      interest: "high" as const,
      description: "Leading online payment processing platform serving millions of businesses globally. Dominant position in developer-first payment infrastructure with expanding financial services.",
    },
    {
      companyName: "Discord Inc.",
      ticker: "DISC",
      ipoDate: "April 2025",
      priceRange: "$28-$34",
      expectedValuation: "$18B",
      sector: "Social Media",
      interest: "high" as const,
      description: "Communication platform with 150M+ monthly active users. Strong engagement in gaming and growing adoption in education and communities.",
    },
    {
      companyName: "Databricks Inc.",
      ticker: "DBRX",
      ipoDate: "May 2025",
      priceRange: "$45-$52",
      expectedValuation: "$43B",
      sector: "Enterprise AI",
      interest: "high" as const,
      description: "Unified data analytics platform combining data warehousing and AI/ML capabilities. Strong enterprise adoption with 10,000+ customers.",
    },
  ];

  const allStocks = [...largeCaps, ...midCaps, ...smallCaps];
  const selectedStockData = allStocks.find(s => s.ticker === selectedStock);

  const mockNews = [
    {
      title: "Company Announces Strong Quarterly Results",
      source: "Bloomberg",
      date: "2 hours ago",
      sentiment: "positive" as const,
      url: "#",
    },
    {
      title: "Analysts Raise Price Target Following Product Launch",
      source: "Reuters",
      date: "5 hours ago",
      sentiment: "positive" as const,
      url: "#",
    },
  ];

  const handleAnalyze = (ticker: string) => {
    console.log(`Analyzing custom stock: ${ticker}`);
    setSelectedStock(ticker);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold" data-testid="text-dashboard-title">AI Stock Recommendations</h1>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          <p className="text-muted-foreground">
            AI-powered analysis combining CatBoost ML, FinBERT sentiment, and Groq LLM insights
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

        <StockAnalysisSearch onAnalyze={handleAnalyze} />

        <div className="space-y-6">
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-2xl font-semibold">Large Cap Stocks</h2>
              <span className="text-sm text-muted-foreground">Market Cap &gt; $200B</span>
            </div>
            <Card className="overflow-hidden">
              {largeCaps.map((stock) => (
                <StockListItem
                  key={stock.ticker}
                  {...stock}
                  onViewDetails={() => setSelectedStock(stock.ticker)}
                />
              ))}
            </Card>
          </div>

          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-2xl font-semibold">Mid Cap Stocks</h2>
              <span className="text-sm text-muted-foreground">Market Cap $10B - $200B</span>
            </div>
            <Card className="overflow-hidden">
              {midCaps.map((stock) => (
                <StockListItem
                  key={stock.ticker}
                  {...stock}
                  onViewDetails={() => setSelectedStock(stock.ticker)}
                />
              ))}
            </Card>
          </div>

          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-2xl font-semibold">Small Cap High-Tech / Recent IPOs</h2>
              <span className="text-sm text-muted-foreground">Market Cap &lt; $10B</span>
            </div>
            <Card className="overflow-hidden">
              {smallCaps.map((stock) => (
                <StockListItem
                  key={stock.ticker}
                  {...stock}
                  onViewDetails={() => setSelectedStock(stock.ticker)}
                />
              ))}
            </Card>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-1">Upcoming IPOs</h2>
            <p className="text-sm text-muted-foreground">
              Companies expected to go public soon
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingIPOs.map((ipo) => (
              <UpcomingIPOCard
                key={ipo.ticker}
                {...ipo}
                onLearnMore={() => console.log(`Learn more about ${ipo.ticker}`)}
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
          aiInsights={`${selectedStockData.companyName} shows exceptional growth potential. The CatBoost model rates this stock at ${selectedStockData.confidenceScore}/100 based on technical indicators, while FinBERT analysis shows ${(selectedStockData.sentimentScore * 100).toFixed(0)}% positive sentiment from recent news coverage. ${selectedStockData.aiReasoning}`}
          technicalAnalysis="The stock is trading above all major moving averages, indicating strong upward momentum. RSI suggests room for growth. Volume analysis reveals consistent buying pressure from institutional investors."
          news={mockNews}
        />
      )}
    </div>
  );
}
