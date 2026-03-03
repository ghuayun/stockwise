import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Building2, DollarSign, TrendingUp, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface IPONewsItem {
  title: string;
  source: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  url: string;
}

export interface IPODetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticker: string;
  companyName: string;
  ipoDate: string;
  priceRange: string;
  expectedValuation: string;
  sector: string;
  description: string;
  interest: "high" | "medium" | "low";
  analysis: string;
  news: IPONewsItem[];
  website?: string;
  industry?: string;
}

export default function IPODetailModal({
  open,
  onOpenChange,
  ticker,
  companyName,
  ipoDate,
  priceRange,
  expectedValuation,
  sector,
  description,
  interest,
  analysis,
  news,
  website,
  industry,
}: IPODetailModalProps) {
  const interestColor = {
    high: "hsl(142 71% 45%)",
    medium: "hsl(43 96% 56%)",
    low: "hsl(0 0% 65%)",
  };

  const sentimentColor = {
    positive: "hsl(142 71% 45%)",
    neutral: "hsl(43 96% 56%)",
    negative: "hsl(0 72% 51%)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]" data-testid={`modal-ipo-detail-${ticker}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold mb-1">
                {companyName}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {ticker}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: interestColor[interest] + "20",
                    color: interestColor[interest],
                  }}
                >
                  {interest.toUpperCase()} INTEREST
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">IPO Date</p>
              <p className="text-sm font-medium">{ipoDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Price Range</p>
              <p className="text-sm font-mono font-medium">{priceRange}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Valuation</p>
              <p className="text-sm font-medium">{expectedValuation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Sector</p>
              <p className="text-sm font-medium">{sector}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news">News & Sentiment</TabsTrigger>
            <TabsTrigger value="analysis" data-testid="tab-analysis">AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Business Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {description}
                  </p>
                </div>

                {website && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Website</h3>
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Globe className="w-4 h-4" />
                      {website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-2">Key Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Ticker Symbol</span>
                      <span className="font-mono font-medium">{ticker}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">IPO Date</span>
                      <span className="font-medium">{ipoDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Price Range</span>
                      <span className="font-mono font-medium">{priceRange}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Expected Valuation</span>
                      <span className="font-medium">{expectedValuation}</span>
                    </div>
                    {industry && (
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Industry</span>
                        <span className="font-medium">{industry}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Sector</span>
                      <span className="font-medium">{sector}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Market Interest</span>
                      <span className="font-medium capitalize">{interest}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="news" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {news.length > 0 ? (
                <div className="space-y-3">
                  {news.map((article, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium flex-1">{article.title}</h4>
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0"
                          style={{
                            backgroundColor: sentimentColor[article.sentiment] + "20",
                            color: sentimentColor[article.sentiment],
                          }}
                        >
                          {article.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {article.source} · {article.date}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => window.open(article.url, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No recent news available for this IPO</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">AI-Powered IPO Analysis</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {analysis}
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
