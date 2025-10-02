import { HistoricalTimeline } from "@/components/HistoricalTimeline";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function Historical() {
  const mockRecommendations = [
    {
      date: "January 15, 2025",
      stocks: [
        { ticker: "AAPL", companyName: "Apple Inc.", recommendedPrice: 178.20, currentPrice: 182.45, performance: 2.38, signal: "BUY" as const },
        { ticker: "MSFT", companyName: "Microsoft Corp.", recommendedPrice: 395.50, currentPrice: 410.80, performance: 3.87, signal: "BUY" as const },
        { ticker: "NVDA", companyName: "NVIDIA Corp.", recommendedPrice: 482.30, currentPrice: 495.22, performance: 2.68, signal: "BUY" as const },
        { ticker: "GOOGL", companyName: "Alphabet Inc.", recommendedPrice: 142.80, currentPrice: 145.20, performance: 1.68, signal: "BUY" as const },
        { ticker: "META", companyName: "Meta Platforms", recommendedPrice: 390.20, currentPrice: 398.50, performance: 2.13, signal: "BUY" as const },
      ],
    },
    {
      date: "January 8, 2025",
      stocks: [
        { ticker: "GOOGL", companyName: "Alphabet Inc.", recommendedPrice: 142.50, currentPrice: 145.20, performance: 1.89, signal: "BUY" as const },
        { ticker: "AMZN", companyName: "Amazon.com", recommendedPrice: 178.80, currentPrice: 172.40, performance: -3.58, signal: "HOLD" as const },
        { ticker: "NVDA", companyName: "NVIDIA Corp.", recommendedPrice: 475.20, currentPrice: 495.22, performance: 4.21, signal: "BUY" as const },
        { ticker: "AMD", companyName: "AMD Inc.", recommendedPrice: 152.30, currentPrice: 148.90, performance: -2.23, signal: "HOLD" as const },
      ],
    },
    {
      date: "January 1, 2025",
      stocks: [
        { ticker: "TSLA", companyName: "Tesla Inc.", recommendedPrice: 245.20, currentPrice: 238.45, performance: -2.75, signal: "HOLD" as const },
        { ticker: "NVDA", companyName: "NVIDIA Corp.", recommendedPrice: 468.50, currentPrice: 495.22, performance: 5.70, signal: "BUY" as const },
        { ticker: "AAPL", companyName: "Apple Inc.", recommendedPrice: 175.80, currentPrice: 182.45, performance: 3.78, signal: "BUY" as const },
      ],
    },
    {
      date: "December 25, 2024",
      stocks: [
        { ticker: "MSFT", companyName: "Microsoft Corp.", recommendedPrice: 385.20, currentPrice: 410.80, performance: 6.64, signal: "BUY" as const },
        { ticker: "GOOGL", companyName: "Alphabet Inc.", recommendedPrice: 138.90, currentPrice: 145.20, performance: 4.54, signal: "BUY" as const },
        { ticker: "META", companyName: "Meta Platforms", recommendedPrice: 378.50, currentPrice: 398.50, performance: 5.28, signal: "BUY" as const },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold" data-testid="text-historical-title">Historical Recommendations</h1>
            <Button variant="outline" data-testid="button-filter-date">
              <Calendar className="w-4 h-4 mr-2" />
              Filter by Date
            </Button>
          </div>
          <p className="text-muted-foreground">
            Track past recommendations and their performance over time
          </p>
        </div>

        <HistoricalTimeline recommendations={mockRecommendations} />
      </div>
    </div>
  );
}
