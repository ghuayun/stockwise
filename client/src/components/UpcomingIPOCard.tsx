import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UpcomingIPOCardProps {
  companyName: string;
  ticker: string;
  ipoDate: string;
  priceRange: string;
  expectedValuation: string;
  sector: string;
  description: string;
  interest: "high" | "medium" | "low";
  onLearnMore?: () => void;
}

export function UpcomingIPOCard({
  companyName,
  ticker,
  ipoDate,
  priceRange,
  expectedValuation,
  sector,
  description,
  interest,
  onLearnMore,
}: UpcomingIPOCardProps) {
  const interestColor = {
    high: "hsl(142 71% 45%)",
    medium: "hsl(43 96% 56%)",
    low: "hsl(0 0% 65%)",
  };

  return (
    <Card className="p-3 hover-elevate active-elevate-2 transition-all">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-semibold" data-testid={`text-ipo-company-${ticker}`}>
              {companyName}
            </h3>
            <Badge
              variant="secondary"
              className="font-mono text-[9px] px-1 py-0"
              data-testid={`badge-ticker-${ticker}`}
            >
              {ticker}
            </Badge>
          </div>
          <Badge
            variant="secondary"
            className="text-[9px] px-1 py-0"
            style={{
              backgroundColor: interestColor[interest] + "20",
              color: interestColor[interest],
            }}
          >
            {interest.toUpperCase()} INTEREST
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <div>
            <p className="text-[9px] text-muted-foreground">IPO Date</p>
            <p className="text-xs font-medium" data-testid={`text-ipo-date-${ticker}`}>{ipoDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3 h-3 text-muted-foreground" />
          <div>
            <p className="text-[9px] text-muted-foreground">Price Range</p>
            <p className="text-xs font-mono font-medium tabular-nums" data-testid={`text-price-range-${ticker}`}>
              {priceRange}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-muted-foreground" />
          <div>
            <p className="text-[9px] text-muted-foreground">Valuation</p>
            <p className="text-xs font-medium" data-testid={`text-valuation-${ticker}`}>{expectedValuation}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-muted-foreground" />
          <div>
            <p className="text-[9px] text-muted-foreground">Sector</p>
            <p className="text-xs font-medium" data-testid={`text-sector-${ticker}`}>{sector}</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2" data-testid={`text-description-${ticker}`}>
        {description}
      </p>

      <Button
        variant="outline"
        className="w-full h-6 text-[10px]"
        onClick={onLearnMore}
        data-testid={`button-learn-more-${ticker}`}
      >
        Learn More
      </Button>
    </Card>
  );
}
