import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface HistoricalRecommendation {
  date: string;
  stocks: {
    ticker: string;
    companyName: string;
    recommendedPrice: number;
    currentPrice: number;
    performance: number;
    signal: "BUY" | "HOLD" | "SELL";
  }[];
}

export interface HistoricalTimelineProps {
  recommendations: HistoricalRecommendation[];
}

export function HistoricalTimeline({ recommendations }: HistoricalTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {recommendations.map((rec, idx) => {
        const isExpanded = expandedIndex === idx;
        const avgPerformance = rec.stocks.reduce((sum, s) => sum + s.performance, 0) / rec.stocks.length;

        return (
          <Card key={idx} className="overflow-hidden" data-testid={`timeline-item-${idx}`}>
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              className="w-full p-4 flex items-center justify-between hover-elevate active-elevate-2 text-left"
              data-testid={`button-expand-timeline-${idx}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{rec.date}</span>
                  <span className="text-xs text-muted-foreground">
                    {rec.stocks.length} recommendations
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={avgPerformance >= 0 ? "bg-[hsl(142_71%_45%)]/20 text-[hsl(142_71%_45%)]" : "bg-[hsl(0_72%_51%)]/20 text-[hsl(0_72%_51%)]"}
                >
                  {avgPerformance >= 0 ? "+" : ""}{avgPerformance.toFixed(2)}% Avg
                </Badge>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {isExpanded && (
              <div className="border-t border-border">
                <div className="p-4 space-y-3">
                  {rec.stocks.map((stock, stockIdx) => (
                    <div
                      key={stockIdx}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`stock-${stock.ticker}-${idx}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-sm">{stock.ticker}</span>
                          <span className="text-xs text-muted-foreground">{stock.companyName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">
                            Rec: ${stock.recommendedPrice.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">
                            Current: ${stock.currentPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`font-mono tabular-nums ${stock.performance >= 0 ? "bg-[hsl(142_71%_45%)]/20 text-[hsl(142_71%_45%)]" : "bg-[hsl(0_72%_51%)]/20 text-[hsl(0_72%_51%)]"}`}
                      >
                        {stock.performance >= 0 ? "+" : ""}{stock.performance.toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
