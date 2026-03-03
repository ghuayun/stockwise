import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WatchlistItem } from "@shared/schema";

export function WatchList() {
  const { toast } = useToast();

  const { data: watchlist = [], isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
    refetchInterval: 60000, // Refresh every minute
  });

  const removeMutation = useMutation({
    mutationFn: async (ticker: string) => {
      await apiRequest("DELETE", `/api/watchlist/${ticker}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Removed",
        description: "Stock removed from watchlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-16 bg-muted rounded"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Watchlist</h3>
        <Badge variant="secondary" className="text-[10px]">
          {watchlist.length}
        </Badge>
      </div>

      {watchlist.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            No stocks in watchlist yet
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Click the star icon on any stock to add it
          </p>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {watchlist.map((item) => {
            const priceChange = item.currentPrice - item.addedPrice;
            const priceChangePercent =
              (priceChange / item.addedPrice) * 100;
            const isPositive = priceChange >= 0;

            return (
              <Card
                key={item.ticker}
                className="p-2 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs truncate">
                        {item.ticker}
                      </span>
                      {item.sector && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0">
                          {item.sector}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.companyName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-medium">
                        ${item.currentPrice.toFixed(2)}
                      </span>
                      <div
                        className={`flex items-center gap-0.5 text-[10px] ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-2.5 h-2.5" />
                        ) : (
                          <TrendingDown className="w-2.5 h-2.5" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {priceChangePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Added at ${item.addedPrice.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-destructive/10"
                    onClick={() => removeMutation.mutate(item.ticker)}
                    disabled={removeMutation.isPending}
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
