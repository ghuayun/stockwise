import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StockListItem } from "@/components/StockListItem";
import { MarketIndicator } from "@/components/MarketIndicator";
import { StockDetailModal } from "@/components/StockDetailModal";
import { StockAnalysisSearch } from "@/components/StockAnalysisSearch";
import { UpcomingIPOCard } from "@/components/UpcomingIPOCard";
import { Activity, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StockRecommendation, StockAnalysis, UpcomingIPO } from "@shared/schema";

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<StockAnalysis | null>(null);
  const { toast } = useToast();

  const { data: recommendations = [], isLoading: loadingRecs } = useQuery<StockRecommendation[]>({
    queryKey: ["/api/recommendations"],
  });

  const { data: ipos = [], isLoading: loadingIPOs } = useQuery<UpcomingIPO[]>({
    queryKey: ["/api/ipos"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/refresh");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({
        title: "Success",
        description: "Stock recommendations refreshed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh recommendations",
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (ticker: string) => {
      const res = await apiRequest("POST", "/api/analyze", { ticker });
      return res.json() as Promise<StockAnalysis>;
    },
    onSuccess: (data) => {
      setSelectedAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `${data.ticker} has been analyzed`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze stock. Please check the ticker symbol.",
        variant: "destructive",
      });
    },
  });

  const largeCaps = recommendations.filter(r => r.marketCapCategory === "large");
  const midCaps = recommendations.filter(r => r.marketCapCategory === "mid");
  const smallCaps = recommendations.filter(r => r.marketCapCategory === "small");

  const selectedStockData = recommendations.find(s => s.ticker === selectedStock);

  const handleAnalyze = (ticker: string) => {
    analyzeMutation.mutate(ticker);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold" data-testid="text-dashboard-title">AI Stock Recommendations</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </div>
              <Button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            AI-powered analysis combining ML models, sentiment analysis, and LLM insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MarketIndicator
            label="S&P 500"
            value="4,783.45"
            change={12.34}
            changePercent={0.26}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MarketIndicator
            label="Market Sentiment"
            value="Bullish"
            change={0.08}
            changePercent={5.2}
            icon={<Activity className="w-4 h-4" />}
          />
          <MarketIndicator
            label="VIX"
            value="13.24"
            change={-0.42}
            changePercent={-3.08}
            icon={<AlertCircle className="w-4 h-4" />}
          />
        </div>

        <StockAnalysisSearch onAnalyze={handleAnalyze} />

        {loadingRecs ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading recommendations...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No recommendations available yet.</p>
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              data-testid="button-initial-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
              Generate Recommendations
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {largeCaps.length > 0 && (
              <div>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="text-2xl font-semibold">Large Cap Stocks</h2>
                  <span className="text-sm text-muted-foreground">Market Cap &gt; $200B</span>
                </div>
                <Card className="overflow-hidden">
                  {largeCaps.map((stock) => (
                    <StockListItem
                      key={stock.ticker}
                      ticker={stock.ticker}
                      companyName={stock.companyName}
                      currentPrice={stock.currentPrice}
                      priceChange={stock.priceChange}
                      priceChangePercent={stock.priceChangePercent}
                      confidenceScore={stock.confidenceScore}
                      signal={stock.signal as "BUY" | "HOLD" | "SELL"}
                      sentiment={stock.sentiment as "positive" | "neutral" | "negative"}
                      pe={stock.pe || 0}
                      volume={stock.volume || "N/A"}
                      institutionalHolding={stock.institutionalHolding || 0}
                      marketCap={stock.marketCap}
                      onViewDetails={() => setSelectedStock(stock.ticker)}
                    />
                  ))}
                </Card>
              </div>
            )}

            {midCaps.length > 0 && (
              <div>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="text-2xl font-semibold">Mid Cap Stocks</h2>
                  <span className="text-sm text-muted-foreground">Market Cap $10B - $200B</span>
                </div>
                <Card className="overflow-hidden">
                  {midCaps.map((stock) => (
                    <StockListItem
                      key={stock.ticker}
                      ticker={stock.ticker}
                      companyName={stock.companyName}
                      currentPrice={stock.currentPrice}
                      priceChange={stock.priceChange}
                      priceChangePercent={stock.priceChangePercent}
                      confidenceScore={stock.confidenceScore}
                      signal={stock.signal as "BUY" | "HOLD" | "SELL"}
                      sentiment={stock.sentiment as "positive" | "neutral" | "negative"}
                      pe={stock.pe || 0}
                      volume={stock.volume || "N/A"}
                      institutionalHolding={stock.institutionalHolding || 0}
                      marketCap={stock.marketCap}
                      onViewDetails={() => setSelectedStock(stock.ticker)}
                    />
                  ))}
                </Card>
              </div>
            )}

            {smallCaps.length > 0 && (
              <div>
                <div className="flex items-baseline gap-3 mb-4">
                  <h2 className="text-2xl font-semibold">Small Cap High-Tech / Recent IPOs</h2>
                  <span className="text-sm text-muted-foreground">Market Cap &lt; $10B</span>
                </div>
                <Card className="overflow-hidden">
                  {smallCaps.map((stock) => (
                    <StockListItem
                      key={stock.ticker}
                      ticker={stock.ticker}
                      companyName={stock.companyName}
                      currentPrice={stock.currentPrice}
                      priceChange={stock.priceChange}
                      priceChangePercent={stock.priceChangePercent}
                      confidenceScore={stock.confidenceScore}
                      signal={stock.signal as "BUY" | "HOLD" | "SELL"}
                      sentiment={stock.sentiment as "positive" | "neutral" | "negative"}
                      pe={stock.pe || 0}
                      volume={stock.volume || "N/A"}
                      institutionalHolding={stock.institutionalHolding || 0}
                      marketCap={stock.marketCap}
                      onViewDetails={() => setSelectedStock(stock.ticker)}
                    />
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}

        {!loadingIPOs && ipos.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-1">Upcoming IPOs</h2>
              <p className="text-sm text-muted-foreground">
                Companies expected to go public soon
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ipos.map((ipo) => (
                <UpcomingIPOCard
                  key={ipo.ticker}
                  companyName={ipo.companyName}
                  ticker={ipo.ticker}
                  ipoDate={ipo.ipoDate}
                  priceRange={ipo.priceRange}
                  expectedValuation={ipo.expectedValuation}
                  sector={ipo.sector}
                  description={ipo.description}
                  interest={ipo.interest as "high" | "medium" | "low"}
                  onLearnMore={() => console.log(`Learn more about ${ipo.ticker}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedStockData && (
        <StockDetailModal
          open={!!selectedStock}
          onOpenChange={(open) => !open && setSelectedStock(null)}
          ticker={selectedStockData.ticker}
          companyName={selectedStockData.companyName}
          currentPrice={selectedStockData.currentPrice}
          priceChange={selectedStockData.priceChange}
          priceChangePercent={selectedStockData.priceChangePercent}
          signal={selectedStockData.signal as "BUY" | "HOLD" | "SELL"}
          aiInsights={`${selectedStockData.companyName} shows strong potential. The hybrid analysis rates this stock at ${selectedStockData.confidenceScore}/100 (ML: ${selectedStockData.mlScore}/100, LLM: ${selectedStockData.llmScore}/100). Sentiment analysis shows ${(selectedStockData.sentimentScore * 100).toFixed(0)}% positive sentiment. ${selectedStockData.aiReasoning}`}
          technicalAnalysis={selectedStockData.technicalAnalysis || "Technical analysis unavailable"}
          news={[]}
        />
      )}

      {selectedAnalysis && (
        <StockDetailModal
          open={!!selectedAnalysis}
          onOpenChange={(open) => !open && setSelectedAnalysis(null)}
          ticker={selectedAnalysis.ticker}
          companyName={selectedAnalysis.companyName}
          currentPrice={selectedAnalysis.currentPrice}
          priceChange={selectedAnalysis.priceChange}
          priceChangePercent={selectedAnalysis.priceChangePercent}
          signal={selectedAnalysis.signal as "BUY" | "HOLD" | "SELL"}
          aiInsights={selectedAnalysis.aiInsights}
          technicalAnalysis={selectedAnalysis.technicalAnalysis || "Technical analysis unavailable"}
          news={selectedAnalysis.news as any}
        />
      )}
    </div>
  );
}
