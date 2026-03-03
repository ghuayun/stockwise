import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

export interface StockAnalysisSearchProps {
  onAnalyze: (ticker: string) => void;
}

export function StockAnalysisSearch({ onAnalyze }: StockAnalysisSearchProps) {
  const [ticker, setTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      setIsLoading(true);
      onAnalyze(ticker.toUpperCase());
      setTimeout(() => {
        setIsLoading(false);
        setTicker("");
      }, 1500);
    }
  };

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold mb-0.5">Custom Stock Analysis</h3>
        <p className="text-xs text-muted-foreground">
          Enter a stock ticker to get AI-powered analysis
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter stock ticker (e.g., TSLA, GOOGL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            className="font-mono uppercase h-8 text-sm"
            data-testid="input-stock-ticker"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={!ticker.trim() || isLoading}
          data-testid="button-analyze-stock"
          className="h-8 text-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-3 h-3 mr-1.5" />
              Analyze
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
