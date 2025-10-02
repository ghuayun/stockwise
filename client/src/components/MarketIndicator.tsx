import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface MarketIndicatorProps {
  label: string;
  value: string;
  change: number;
  changePercent: number;
  icon?: React.ReactNode;
}

export function MarketIndicator({
  label,
  value,
  change,
  changePercent,
  icon,
}: MarketIndicatorProps) {
  const isPositive = change >= 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono font-semibold tabular-nums" data-testid={`text-value-${label.replace(/\s/g, '-').toLowerCase()}`}>
          {value}
        </span>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-[hsl(142_71%_45%)]" : "text-[hsl(0_72%_51%)]"}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span className="font-mono tabular-nums">
            {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
