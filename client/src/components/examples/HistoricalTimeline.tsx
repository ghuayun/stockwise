import { HistoricalTimeline } from "../HistoricalTimeline";

export default function HistoricalTimelineExample() {
  const mockData = [
    {
      date: "January 15, 2025",
      stocks: [
        { ticker: "AAPL", companyName: "Apple Inc.", recommendedPrice: 178.20, currentPrice: 182.45, performance: 2.38, signal: "BUY" as const },
        { ticker: "MSFT", companyName: "Microsoft Corp.", recommendedPrice: 395.50, currentPrice: 410.80, performance: 3.87, signal: "BUY" as const },
        { ticker: "NVDA", companyName: "NVIDIA Corp.", recommendedPrice: 482.30, currentPrice: 495.22, performance: 2.68, signal: "BUY" as const },
      ],
    },
    {
      date: "January 8, 2025",
      stocks: [
        { ticker: "GOOGL", companyName: "Alphabet Inc.", recommendedPrice: 142.50, currentPrice: 145.20, performance: 1.89, signal: "BUY" as const },
        { ticker: "AMZN", companyName: "Amazon.com", recommendedPrice: 178.80, currentPrice: 172.40, performance: -3.58, signal: "HOLD" as const },
      ],
    },
  ];

  return (
    <div className="p-6 bg-background">
      <div className="max-w-3xl">
        <HistoricalTimeline recommendations={mockData} />
      </div>
    </div>
  );
}
