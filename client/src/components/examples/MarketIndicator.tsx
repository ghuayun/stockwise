import { MarketIndicator } from "../MarketIndicator";
import { Activity } from "lucide-react";

export default function MarketIndicatorExample() {
  return (
    <div className="p-6 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <MarketIndicator
          label="S&P 500"
          value="4,783.45"
          change={12.34}
          changePercent={0.26}
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
        />
      </div>
    </div>
  );
}
