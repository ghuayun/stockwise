import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StockListItemProps {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  confidenceScore: number;
  signal: "BUY" | "HOLD" | "SELL";
  sentiment: "positive" | "neutral" | "negative";
  pe: number;
  volume: string;
  institutionalHolding: number;
  marketCap: string;
  onViewDetails?: () => void;
}

export function StockListItem({
  ticker,
  companyName,
  currentPrice,
  priceChange,
  priceChangePercent,
  confidenceScore,
  signal,
  sentiment,
  pe,
  volume,
  institutionalHolding,
  marketCap,
  onViewDetails,
}: StockListItemProps) {
  const isPositive = priceChange >= 0;
  const signalColor = {
    BUY: "hsl(142 71% 45%)",
    HOLD: "hsl(43 96% 56%)",
    SELL: "hsl(0 72% 51%)",
  };

  const sentimentColor = {
    positive: "hsl(142 71% 45%)",
    neutral: "hsl(43 96% 56%)",
    negative: "hsl(0 72% 51%)",
  };

  return (
    <div
      className="border-b border-border last:border-0 hover-elevate active-elevate-2 transition-all"
      data-testid={`stock-item-${ticker}`}
    >
      <button
        onClick={onViewDetails}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-3">
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: signalColor[signal] }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-semibold text-sm tracking-wider uppercase" data-testid={`text-ticker-${ticker}`}>
                    {ticker}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                    style={{
                      backgroundColor: sentimentColor[sentiment] + "20",
                      color: sentimentColor[sentiment],
                      borderColor: sentimentColor[sentiment] + "40",
                    }}
                  >
                    {sentiment.charAt(0).toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate" data-testid={`text-company-${ticker}`}>
                  {companyName}
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-2 text-right">
            <div className="text-base font-mono font-semibold tabular-nums" data-testid={`text-price-${ticker}`}>
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center justify-end gap-1 text-xs font-medium ${isPositive ? "text-[hsl(142_71%_45%)]" : "text-[hsl(0_72%_51%)]"}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="font-mono tabular-nums">
                {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
            <p className="text-sm font-mono font-medium tabular-nums">{marketCap}</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs text-muted-foreground mb-1">P/E</p>
            <p className="text-sm font-mono font-medium tabular-nums">{pe.toFixed(1)}</p>
          </div>

          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Volume</p>
            <p className="text-sm font-mono font-medium tabular-nums">{volume}</p>
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <Progress value={confidenceScore} className="h-1.5" />
              </div>
              <span className="text-sm font-mono font-semibold tabular-nums">{confidenceScore}%</span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>
    </div>
  );
}
