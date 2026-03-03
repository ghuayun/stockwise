import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  url: string;
}

export interface StockDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  signal: "BUY" | "HOLD" | "SELL";
  aiInsights: string;
  technicalAnalysis: string;
  businessSummary?: string;
  sector?: string;
  news: NewsItem[];
}

export function StockDetailModal({
  open,
  onOpenChange,
  ticker,
  companyName,
  currentPrice,
  priceChange,
  priceChangePercent,
  signal,
  aiInsights,
  technicalAnalysis,
  businessSummary,
  sector,
  news,
}: StockDetailModalProps) {
  const isPositive = priceChange >= 0;
  const signalColor = {
    BUY: "hsl(142 71% 45%)",
    HOLD: "hsl(43 96% 56%)",
    SELL: "hsl(0 72% 51%)",
  };

  // Function to render markdown-style text with proper formatting
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Check if line starts with ** (bold section header)
      if (line.startsWith('**') && line.includes('**:')) {
        const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/);
        if (match) {
          return (
            <div key={index} className="mb-3">
              <span className="font-semibold text-foreground">{match[1]}: </span>
              <span>{match[2]}</span>
            </div>
          );
        }
      }
      // Regular line
      if (line.trim()) {
        return <div key={index} className="mb-2">{line}</div>;
      }
      return null;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]" data-testid={`modal-stock-detail-${ticker}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-mono font-semibold tracking-wider uppercase mb-1">
                {ticker}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{companyName}</p>
              {sector && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 mt-1">
                  {sector}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-semibold tabular-nums mb-1">
                ${currentPrice.toFixed(2)}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-[hsl(142_71%_45%)]" : "text-[hsl(0_72%_51%)]"}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-mono tabular-nums">
                  {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: signalColor[signal] }}
              />
              <span className="text-sm font-medium" style={{ color: signalColor[signal] }}>
                {signal}
              </span>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news">News & Sentiment</TabsTrigger>
            <TabsTrigger value="technical" data-testid="tab-technical">Technical Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {businessSummary && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Business Summary</h3>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {businessSummary}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-semibold mb-3">AI Insights</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {renderFormattedText(aiInsights)}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="news" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {news.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-md border border-border hover-elevate"
                    data-testid={`news-item-${idx}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="text-sm font-medium flex-1">{item.title}</h4>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: item.sentiment === "positive" ? "hsl(142 71% 45% / 0.2)" :
                            item.sentiment === "negative" ? "hsl(0 72% 51% / 0.2)" : "hsl(43 96% 56% / 0.2)",
                          color: item.sentiment === "positive" ? "hsl(142 71% 45%)" :
                            item.sentiment === "negative" ? "hsl(0 72% 51%)" : "hsl(43 96% 56%)",
                        }}
                      >
                        {item.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{item.date}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-auto"
                        onClick={() => window.open(item.url, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="technical" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Technical Analysis</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {renderFormattedText(technicalAnalysis)}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
