import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { WatchlistItem } from "@shared/schema";

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
  sector?: string;
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
  sector,
  onViewDetails,
}: StockListItemProps) {
  const isPositive = priceChange >= 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Check if stock is in watchlist
  const { data: watchlistItems } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
  });
  
  const isInWatchlist = watchlistItems?.some(
    (item) => item.ticker === ticker
  );

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      console.log("Adding to watchlist:", { ticker, companyName, sector, currentPrice, marketCap });
      
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          companyName,
          sector: sector || "Unknown",
          currentPrice,
          marketCap,
        }),
      });
      
      console.log("Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to add to watchlist";
        const contentType = response.headers.get("content-type");
        
        try {
          if (contentType?.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            console.error("Non-JSON error response:", errorText.substring(0, 200));
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Successfully added to watchlist:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Added to watchlist",
        description: `${ticker} has been added to your watchlist.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to watchlist",
        variant: "destructive",
      });
    },
  });

  const handleAddToWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the view details
    if (!isInWatchlist) {
      addToWatchlistMutation.mutate();
    }
  };

  return (
    <div
      className="border-b border-border last:border-0 hover-elevate active-elevate-2 transition-all"
      data-testid={`stock-item-${ticker}`}
    >
      <button
        onClick={onViewDetails}
        className="w-full p-2 flex items-center gap-2 text-left"
      >
        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: signalColor[signal] }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono font-semibold text-xs tracking-wider uppercase" data-testid={`text-ticker-${ticker}`}>
                    {ticker}
                  </span>
                  {sector && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0" data-testid={`badge-sector-${ticker}`}>{sector}</Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0"
                    style={{
                      backgroundColor: sentimentColor[sentiment] + "20",
                      color: sentimentColor[sentiment],
                      borderColor: sentimentColor[sentiment] + "40",
                    }}
                  >
                    {sentiment.charAt(0).toUpperCase()}
                  </Badge>
                  <button
                    onClick={handleAddToWatchlist}
                    disabled={isInWatchlist}
                    className={`ml-1 p-0.5 rounded hover:bg-accent transition-colors ${
                      isInWatchlist 
                        ? "text-yellow-500 cursor-default" 
                        : "text-muted-foreground hover:text-yellow-500"
                    }`}
                    title={isInWatchlist ? "Already in watchlist" : "Add to watchlist"}
                  >
                    <Star className={`w-3 h-3 ${isInWatchlist ? "fill-yellow-500" : ""}`} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground truncate" data-testid={`text-company-${ticker}`}>
                  {companyName}
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-2 text-right">
            <div className="text-sm font-mono font-semibold tabular-nums" data-testid={`text-price-${ticker}`}>
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center justify-end gap-0.5 text-[10px] font-medium ${isPositive ? "text-[hsl(142_71%_45%)]" : "text-[hsl(0_72%_51%)]"}`}>
              {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              <span className="font-mono tabular-nums">
                {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="col-span-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Market Cap</p>
            <p className="text-xs font-mono font-medium tabular-nums">{marketCap}</p>
          </div>

          <div className="col-span-1">
            <p className="text-[10px] text-muted-foreground mb-0.5">P/E</p>
            <p className="text-xs font-mono font-medium tabular-nums">{pe.toFixed(1)}</p>
          </div>

          <div className="col-span-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Volume</p>
            <p className="text-xs font-mono font-medium tabular-nums">{volume}</p>
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-0.5">Confidence</p>
                <Progress value={confidenceScore} className="h-1" />
              </div>
              <span className="text-xs font-mono font-semibold tabular-nums">{confidenceScore}%</span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>
    </div>
  );
}
