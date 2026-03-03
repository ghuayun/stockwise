import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StockCardProps {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  confidenceScore: number;
  signal: "BUY" | "HOLD" | "SELL";
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  pe: number;
  volume: string;
  institutionalHolding: number;
  aiReasoning: string;
  sector?: string;
  onViewDetails?: () => void;
}

export function StockCard({
  ticker,
  companyName,
  currentPrice,
  priceChange,
  priceChangePercent,
  confidenceScore,
  signal,
  sentiment,
  sentimentScore,
  pe,
  volume,
  institutionalHolding,
  aiReasoning,
  sector,
  onViewDetails,
}: StockCardProps) {
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
    <Card className="p-6 hover-elevate active-elevate-2 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-mono font-semibold tracking-wider uppercase" data-testid={`text-ticker-${ticker}`}>
              {ticker}
            </h3>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: signalColor[signal] }}
              />
              <span className="text-xs font-medium" style={{ color: signalColor[signal] }}>
                {signal}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground" data-testid={`text-company-${ticker}`}>
            {companyName}
          </p>
          {sector && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1" data-testid={`badge-sector-${ticker}`}>
              {sector}
            </Badge>
          )}
        </div>
        <Badge
          variant="secondary"
          className="font-mono tabular-nums"
          style={{
            backgroundColor: sentimentColor[sentiment] + "20",
            color: sentimentColor[sentiment],
            borderColor: sentimentColor[sentiment] + "40",
          }}
          data-testid={`badge-sentiment-${ticker}`}
        >
          {sentiment.toUpperCase()}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-mono font-semibold tabular-nums" data-testid={`text-price-${ticker}`}>
            ${currentPrice.toFixed(2)}
          </span>
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-[hsl(142_71%_45%)]" : "text-[hsl(0_72%_51%)]"}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-mono tabular-nums">
              {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">P/E Ratio</p>
          <p className="text-sm font-mono font-medium tabular-nums" data-testid={`text-pe-${ticker}`}>{pe.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Volume</p>
          <p className="text-sm font-mono font-medium tabular-nums" data-testid={`text-volume-${ticker}`}>{volume}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Inst. Hold.</p>
          <p className="text-sm font-mono font-medium tabular-nums" data-testid={`text-institutional-${ticker}`}>{institutionalHolding}%</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Confidence Score</span>
          <span className="text-sm font-mono font-semibold tabular-nums" data-testid={`text-confidence-${ticker}`}>
            {confidenceScore}%
          </span>
        </div>
        <Progress value={confidenceScore} className="h-2" />
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-reasoning-${ticker}`}>
          {aiReasoning}
        </p>
      </div>

      <Button
        variant="ghost"
        className="w-full justify-between group"
        onClick={onViewDetails}
        data-testid={`button-view-details-${ticker}`}
      >
        <span>View Details</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </Card>
  );
}
