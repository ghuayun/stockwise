import { StockCard } from "../StockCard";

export default function StockCardExample() {
  return (
    <div className="p-6 bg-background">
      <div className="max-w-md">
        <StockCard
          ticker="AAPL"
          companyName="Apple Inc."
          currentPrice={182.45}
          priceChange={3.24}
          priceChangePercent={1.81}
          confidenceScore={87}
          signal="BUY"
          sentiment="positive"
          sentimentScore={0.78}
          pe={28.5}
          volume="52.3M"
          institutionalHolding={62.4}
          aiReasoning="Strong fundamentals with growing services revenue. Positive sentiment from recent product launches and institutional accumulation."
          onViewDetails={() => console.log("View AAPL details")}
        />
      </div>
    </div>
  );
}
