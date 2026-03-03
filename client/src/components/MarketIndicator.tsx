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
    <Card className="p-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-mono font-semibold tabular-nums" data-testid={`text-value-${label.replace(/\s/g, '-').toLowerCase()}`}>
          {value}
        </span>
        <div className={`flex items-center gap-0.5 text-[10px] font-medium ${isPositive ? "text-[hsl(142_71%_45%)]" : "text-[hsl(0_72%_51%)]"}`}>
          {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          <span className="font-mono tabular-nums">
            {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
