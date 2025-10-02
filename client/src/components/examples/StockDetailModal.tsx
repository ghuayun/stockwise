import { StockDetailModal } from "../StockDetailModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function StockDetailModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)}>Open Stock Detail</Button>
      <StockDetailModal
        open={open}
        onOpenChange={setOpen}
        ticker="NVDA"
        companyName="NVIDIA Corporation"
        currentPrice={495.22}
        priceChange={12.45}
        priceChangePercent={2.58}
        signal="BUY"
        aiInsights="NVIDIA shows exceptional growth potential driven by AI chip demand. The company's dominant position in the GPU market combined with expanding data center revenue creates a strong bullish case. Recent earnings beat expectations by 15%, and institutional investors have increased their positions by 8% in the last quarter. The CatBoost model rates this stock at 92/100 based on technical indicators, while FinBERT analysis of recent news shows 85% positive sentiment."
        technicalAnalysis="The stock is trading above all major moving averages (50-day, 100-day, and 200-day), indicating strong upward momentum. RSI at 68 suggests the stock is approaching overbought territory but still has room for growth. MACD shows bullish crossover with increasing histogram bars. Volume analysis reveals consistent buying pressure from institutional investors. Support level identified at $470, resistance at $510."
        news={[
          {
            title: "NVIDIA Announces Next-Gen AI Chips with 40% Performance Boost",
            source: "TechCrunch",
            date: "2 hours ago",
            sentiment: "positive",
            url: "#",
          },
          {
            title: "Major Cloud Providers Increase NVIDIA GPU Orders",
            source: "Reuters",
            date: "5 hours ago",
            sentiment: "positive",
            url: "#",
          },
          {
            title: "Analysts Raise Price Target Following Strong Q4 Results",
            source: "Bloomberg",
            date: "1 day ago",
            sentiment: "positive",
            url: "#",
          },
        ]}
      />
    </div>
  );
}
