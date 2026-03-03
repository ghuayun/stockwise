import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StockListItem } from "@/components/StockListItem";
import { MarketIndicator } from "@/components/MarketIndicator";
import { StockDetailModal } from "@/components/StockDetailModal";
import IPODetailModal from "@/components/IPODetailModal";
import { StockAnalysisSearch } from "@/components/StockAnalysisSearch";
import { UpcomingIPOCard } from "@/components/UpcomingIPOCard";
import { WatchList } from "@/components/WatchList";
import { Activity, TrendingUp, AlertCircle, RefreshCw, Filter, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StockRecommendation, StockAnalysis, UpcomingIPO } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MarketData {
  label: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

interface IPODetail extends UpcomingIPO {
  news: Array<{
    title: string;
    source: string;
    date: string;
    sentiment: "positive" | "neutral" | "negative";
    url: string;
  }>;
  analysis: string;
  website?: string;
  industry?: string;
}

export default function Dashboard() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<StockAnalysis | null>(null);
  const [selectedIPO, setSelectedIPO] = useState<IPODetail | null>(null);
  const [loadingIPODetail, setLoadingIPODetail] = useState(false);
  const [sectorFilter, setSectorFilter] = useState<string>("Technology"); // Default to Technology
  const [ipoPage, setIpoPage] = useState(0);
  const iposPerPage = 5; // Show 5 IPOs per page
  const { toast } = useToast();

  const { data: recommendations = [], isLoading: loadingRecs } = useQuery<StockRecommendation[]>({
    queryKey: ["/api/recommendations", sectorFilter !== "all" ? `?sector=${sectorFilter}` : ""],
  });

  const { data: marketData = [], isLoading: loadingMarket } = useQuery<MarketData[]>({
    queryKey: ["/api/market-data"],
    refetchInterval: 60000, // Refetch every minute
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

  const refreshIPOMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ipos/refresh");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipos"] });
      toast({
        title: "Success",
        description: "IPO data refreshed from Finnhub",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh IPO data",
        variant: "destructive",
      });
    },
  });

  const handleIPOLearnMore = async (ticker: string) => {
    setLoadingIPODetail(true);
    try {
      const res = await apiRequest("GET", `/api/ipos/${ticker}`);
      const data = await res.json();
      setSelectedIPO(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load IPO details",
        variant: "destructive",
      });
    } finally {
      setLoadingIPODetail(false);
    }
  };

  const largeCaps = recommendations.filter(r => r.marketCapCategory === "large");
  const midCaps = recommendations.filter(r => r.marketCapCategory === "mid");
  const smallCaps = recommendations.filter(r => r.marketCapCategory === "small");

  // Group stocks by sector within each market cap category
  const groupBySector = (stocks: StockRecommendation[]) => {
    const sectors = ["Technology", "Healthcare", "Financial Services", "Consumer Cyclical", "Energy"];
    return sectors.map(sector => ({
      sector,
      stocks: stocks.filter(s => s.sector === sector)
    })).filter(group => group.stocks.length > 0);
  };

  const largeBySector = groupBySector(largeCaps);
  const midBySector = groupBySector(midCaps);
  const smallBySector = groupBySector(smallCaps);

  const handleAnalyze = (ticker: string) => {
    analyzeMutation.mutate(ticker);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto p-2 space-y-1">
        {/* Header */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-0">
            <h1 className="text-lg font-bold" data-testid="text-dashboard-title">AI Stock Recommendations</h1>
            <div className="flex items-center gap-2">
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="h-7 w-[160px] text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Financial Services">Financial Services</SelectItem>
                  <SelectItem value="Consumer Cyclical">Consumer Cyclical</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-[10px] text-muted-foreground hidden md:block">
                Updated: {new Date().toLocaleString()}
              </div>
              <Button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                variant="outline"
                size="sm"
                data-testid="button-refresh"
                className="h-7 text-xs px-2"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            AI-powered analysis combining ML models, sentiment analysis, and LLM insights
          </p>
        </div>

        {/* Main content with sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-2">
          {/* Left column - Main content */}
          <div className="space-y-1">
            {/* Market indicators - more compact */}
            {loadingMarket ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="p-1.5 animate-pulse">
                    <div className="h-10 bg-muted rounded" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
                {marketData.slice(0, 4).map((data) => {
                  const isVIX = data.label === "VIX";
                  return (
                    <MarketIndicator
                      key={data.label}
                      label={data.label}
                      value={data.value.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                      change={data.change}
                      changePercent={data.changePercent}
                      icon={isVIX ? <AlertCircle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    />
                  );
                })}
                <MarketIndicator
                  label="Sentiment"
                  value={marketData.length > 0 && marketData[0].changePercent > 0 ? "Bullish" : "Bearish"}
                  change={marketData.length > 0 ? marketData[0].change : 0}
                  changePercent={marketData.length > 0 ? marketData[0].changePercent : 0}
                  icon={<Activity className="w-4 h-4" />}
                />
              </div>
            )}

            <StockAnalysisSearch onAnalyze={handleAnalyze} />

            {/* Stock recommendations */}
            {loadingRecs ? (
              <div className="text-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loading recommendations...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <Card className="p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1.5">No recommendations available yet.</p>
                <Button
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending}
                  data-testid="button-initial-refresh"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
                  Generate Recommendations
                </Button>
              </Card>
            ) : (
              <div className="space-y-1">
                {largeBySector.length > 0 && (
                  <div>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h2 className="text-sm font-semibold">Large Cap Stocks</h2>
                      <span className="text-[10px] text-muted-foreground">Market Cap &gt; $200B</span>
                    </div>
                    {largeBySector.map(({ sector, stocks }) => (
                      <div key={sector} className="mb-1">
                        <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center gap-1.5">
                          <span className="inline-block w-0.5 h-3 bg-primary rounded"></span>
                          {sector} ({stocks.length})
                        </h3>
                    <Card className="overflow-hidden">
                      {stocks.map((stock) => (
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
                          sector={stock.sector || undefined}
                          onViewDetails={() => handleAnalyze(stock.ticker)}
                        />
                      ))}
                    </Card>
                  </div>
                ))}
              </div>
            )}

                {midBySector.length > 0 && (
                  <div>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h2 className="text-sm font-semibold">Mid Cap Stocks</h2>
                      <span className="text-[10px] text-muted-foreground">Market Cap $10B - $200B</span>
                    </div>
                    {midBySector.map(({ sector, stocks }) => (
                      <div key={sector} className="mb-1">
                        <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center gap-1.5">
                          <span className="inline-block w-0.5 h-3 bg-primary rounded"></span>
                          {sector} ({stocks.length})
                        </h3>
                    <Card className="overflow-hidden">
                      {stocks.map((stock) => (
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
                          sector={stock.sector || undefined}
                          onViewDetails={() => handleAnalyze(stock.ticker)}
                        />
                      ))}
                    </Card>
                  </div>
                ))}
              </div>
            )}

                {smallBySector.length > 0 && (
                  <div>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h2 className="text-sm font-semibold">Small Cap High-Tech / Recent IPOs</h2>
                      <span className="text-[10px] text-muted-foreground">Market Cap &lt; $10B</span>
                    </div>
                    {smallBySector.map(({ sector, stocks }) => (
                      <div key={sector} className="mb-1">
                        <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center gap-1.5">
                          <span className="inline-block w-0.5 h-3 bg-primary rounded"></span>
                          {sector} ({stocks.length})
                        </h3>
                        <Card className="overflow-hidden">
                          {stocks.map((stock) => (
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
                              sector={stock.sector || undefined}
                              onViewDetails={() => handleAnalyze(stock.ticker)}
                            />
                          ))}
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column - Watchlist sidebar */}
          <div className="hidden lg:block space-y-2">
            <div className="sticky top-2 space-y-2">
              <WatchList />
              
              {/* IPOs section - compact list in sidebar */}
              {!loadingIPOs && ipos.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <h2 className="text-sm font-semibold">Upcoming IPOs</h2>
                    <Button
                      onClick={() => refreshIPOMutation.mutate()}
                      disabled={refreshIPOMutation.isPending}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Refresh IPOs"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshIPOMutation.isPending ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  <Card className="overflow-hidden">
                    {ipos.slice(ipoPage * iposPerPage, (ipoPage + 1) * iposPerPage).map((ipo, index) => {
                      const interestColor = {
                        high: "hsl(142 71% 45%)",
                        medium: "hsl(43 96% 56%)",
                        low: "hsl(0 0% 65%)",
                      };
                      const interest = ipo.interest as "high" | "medium" | "low";
                      
                      return (
                        <div
                          key={ipo.ticker}
                          className="border-b border-border last:border-0 hover-elevate active-elevate-2 transition-all cursor-pointer"
                          onClick={() => handleIPOLearnMore(ipo.ticker)}
                        >
                          <div className="p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: interestColor[interest] }}
                              />
                              <span className="font-semibold text-xs truncate" data-testid={`text-ipo-company-${ipo.ticker}`}>
                                {ipo.companyName}
                              </span>
                              <Badge variant="outline" className="text-[8px] px-1 py-0 flex-shrink-0" data-testid={`badge-ticker-${ipo.ticker}`}>
                                {ipo.ticker}
                              </Badge>
                            </div>
                            
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[9px]">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium" data-testid={`text-ipo-date-${ipo.ticker}`}>{ipo.ipoDate}</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-mono font-medium" data-testid={`text-price-range-${ipo.ticker}`}>{ipo.priceRange}</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                <span className="text-muted-foreground">Value:</span>
                                <span className="font-medium" data-testid={`text-valuation-${ipo.ticker}`}>{ipo.expectedValuation}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                  
                  {/* Pagination controls */}
                  {ipos.length > iposPerPage && (
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <Button
                        onClick={() => setIpoPage(Math.max(0, ipoPage - 1))}
                        disabled={ipoPage === 0}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                      >
                        Previous
                      </Button>
                      <span className="text-muted-foreground">
                        {ipoPage + 1} / {Math.ceil(ipos.length / iposPerPage)}
                      </span>
                      <Button
                        onClick={() => setIpoPage(Math.min(Math.ceil(ipos.length / iposPerPage) - 1, ipoPage + 1))}
                        disabled={ipoPage >= Math.ceil(ipos.length / iposPerPage) - 1}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          businessSummary={selectedAnalysis.businessSummary || undefined}
          news={selectedAnalysis.news}
        />
      )}

      {selectedIPO && (
        <IPODetailModal
          open={!!selectedIPO}
          onOpenChange={(open: boolean) => !open && setSelectedIPO(null)}
          ticker={selectedIPO.ticker}
          companyName={selectedIPO.companyName}
          ipoDate={selectedIPO.ipoDate}
          priceRange={selectedIPO.priceRange}
          expectedValuation={selectedIPO.expectedValuation}
          sector={selectedIPO.sector}
          description={selectedIPO.description}
          interest={selectedIPO.interest as "high" | "medium" | "low"}
          analysis={selectedIPO.analysis}
          news={selectedIPO.news}
          website={selectedIPO.website}
          industry={selectedIPO.industry}
        />
      )}
    </div>
  );
}
