import { StockListItem } from "../StockListItem";

export default function StockListItemExample() {
  return (
    <div className="p-6 bg-background">
      <div className="max-w-6xl border border-border rounded-md overflow-hidden">
        <StockListItem
          ticker="AAPL"
          companyName="Apple Inc."
          currentPrice={182.45}
          priceChange={3.24}
          priceChangePercent={1.81}
          confidenceScore={87}
          signal="BUY"
          sentiment="positive"
          pe={28.5}
          volume="52.3M"
          institutionalHolding={62.4}
          marketCap="$2.8T"
          onViewDetails={() => console.log("View AAPL details")}
        />
        <StockListItem
          ticker="MSFT"
          companyName="Microsoft Corporation"
          currentPrice={410.80}
          priceChange={8.50}
          priceChangePercent={2.11}
          confidenceScore={89}
          signal="BUY"
          sentiment="positive"
          pe={35.2}
          volume="28.5M"
          institutionalHolding={73.1}
          marketCap="$3.1T"
          onViewDetails={() => console.log("View MSFT details")}
        />
      </div>
    </div>
  );
}
