import { HistoricalTimeline } from "@/components/HistoricalTimeline";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface HistoricalRecommendation {
  date: string;
  stocks: Array<{
    ticker: string;
    companyName: string;
    recommendedPrice: number;
    currentPrice: number;
    performance: number;
    signal: "BUY" | "HOLD" | "SELL";
  }>;
}

export default function Historical() {
  const { data: historicalData, isLoading, error } = useQuery<HistoricalRecommendation[]>({
    queryKey: ["historical-recommendations"],
    queryFn: async () => {
      const response = await fetch("/api/recommendations/historical");
      if (!response.ok) {
        throw new Error("Failed to fetch historical recommendations");
      }
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold" data-testid="text-historical-title">Historical Recommendations</h1>
            <Button variant="outline" className="h-8 text-xs" data-testid="button-filter-date">
              <Calendar className="w-3 h-3 mr-1.5" />
              Filter by Date
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Track past recommendations and their performance over time
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading historical data...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading historical data. Please try again later.</p>
          </div>
        )}

        {!isLoading && !error && historicalData && (
          <>
            {historicalData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No historical data available yet. Historical snapshots will be saved when recommendations refresh.</p>
              </div>
            ) : (
              <HistoricalTimeline recommendations={historicalData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
