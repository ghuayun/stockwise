import yahooFinance from "yahoo-finance2";

export interface StockDiscoveryConfig {
  largeCaps: number; // Number of large cap stocks to include
  midCaps: number;   // Number of mid cap stocks to include
  smallCaps: number; // Number of small cap stocks to include
}

interface DiscoveredStocks {
  largeCaps: string[];
  midCaps: string[];
  smallCaps: string[];
  allTickers: string[];
}

class StockDiscoveryService {
  private fallbackTickers = {
    largeCaps: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO", "WMT", "ASML", "MU", "COST", "AMD", "PLTR", "NFLX"],
    midCaps: ["CRWD", "DDOG", "NET", "ZS", "RKLB", "SHOP", "APP", "PANW", "ADBE", "ISRG", "BKNG", "INTU", "QCOM", "HON", "ADI"],
    smallCaps: ["RXRX", "SWKS", "AAL", "DXPE", "CENT", "ODD", "KALU", "WLDN", "SKWD", "SLDE"],
  };

  /**
   * Discover trending stocks dynamically from market data
   */
  async discoverStocks(config: StockDiscoveryConfig): Promise<DiscoveredStocks> {
    console.log("Discovering trending stocks...");
    
    try {
      // Try to get market movers (most active, gainers)
      const trending = await this.getTrendingStocks();
      
      if (trending.length > 0) {
        // Classify stocks by market cap
        const classified = await this.classifyByMarketCap(trending);
        
        // Select stocks according to config
        const largeCaps = classified.large.slice(0, config.largeCaps);
        const midCaps = classified.mid.slice(0, config.midCaps);
        const smallCaps = classified.small.slice(0, config.smallCaps);
        
        // If we don't have enough stocks, supplement with fallbacks
        const finalLarge = this.supplementWithFallbacks(largeCaps, this.fallbackTickers.largeCaps, config.largeCaps);
        const finalMid = this.supplementWithFallbacks(midCaps, this.fallbackTickers.midCaps, config.midCaps);
        const finalSmall = this.supplementWithFallbacks(smallCaps, this.fallbackTickers.smallCaps, config.smallCaps);
        
        console.log(`Discovered: ${finalLarge.length} large caps, ${finalMid.length} mid caps, ${finalSmall.length} small caps`);
        
        return {
          largeCaps: finalLarge,
          midCaps: finalMid,
          smallCaps: finalSmall,
          allTickers: [...finalLarge, ...finalMid, ...finalSmall],
        };
      }
    } catch (error) {
      console.error("Error discovering stocks:", error);
    }
    
    // Fallback to curated lists
    console.log("Using fallback stock lists");
    return this.getFallbackStocks(config);
  }

  /**
   * Get trending stocks from market screeners
   */
  private async getTrendingStocks(): Promise<string[]> {
    try {
      // Get most active stocks (high volume indicators)
      const screenerResult = await yahooFinance.screener({
        scrIds: "most_actives", // Most active by volume
        count: 50,
      });

      if (screenerResult?.quotes && screenerResult.quotes.length > 0) {
        // Filter for US stocks with valid tickers
        const tickers = screenerResult.quotes
          .filter((quote: any) => 
            quote.symbol && 
            !quote.symbol.includes(".") && // No foreign exchanges
            quote.symbol.length <= 5 && // Typical US ticker length
            quote.quoteType === "EQUITY" // Only equities
          )
          .map((quote: any) => quote.symbol);
        
        console.log(`Found ${tickers.length} trending stocks from market screener`);
        return tickers;
      }
    } catch (error) {
      console.error("Error fetching trending stocks:", error);
    }

    // Additional fallback: try day gainers
    try {
      const gainersResult = await yahooFinance.screener({
        scrIds: "day_gainers",
        count: 30,
      });

      if (gainersResult?.quotes && gainersResult.quotes.length > 0) {
        const tickers = gainersResult.quotes
          .filter((quote: any) => 
            quote.symbol && 
            !quote.symbol.includes(".") &&
            quote.symbol.length <= 5 &&
            quote.quoteType === "EQUITY"
          )
          .map((quote: any) => quote.symbol);
        
        console.log(`Found ${tickers.length} gaining stocks from market screener`);
        return tickers;
      }
    } catch (error) {
      console.error("Error fetching gainers:", error);
    }

    return [];
  }

  /**
   * Classify stocks by market cap
   */
  private async classifyByMarketCap(tickers: string[]): Promise<{
    large: string[];
    mid: string[];
    small: string[];
  }> {
    const large: string[] = [];
    const mid: string[] = [];
    const small: string[] = [];

    // Fetch quotes in batches to get market cap
    for (const ticker of tickers) {
      try {
        const quote = await yahooFinance.quote(ticker);
        
        if (quote?.marketCap) {
          const marketCap = quote.marketCap;
          
          if (marketCap > 200_000_000_000) {
            // > $200B
            large.push(ticker);
          } else if (marketCap > 10_000_000_000) {
            // $10B - $200B
            mid.push(ticker);
          } else if (marketCap > 300_000_000) {
            // $300M - $10B (filter out micro caps)
            small.push(ticker);
          }
        }
      } catch (error) {
        // Skip stocks that fail to fetch
        console.error(`Error classifying ${ticker}:`, error);
      }
    }

    console.log(`Classified: ${large.length} large, ${mid.length} mid, ${small.length} small cap stocks`);
    return { large, mid, small };
  }

  /**
   * Supplement discovered stocks with fallbacks if needed
   */
  private supplementWithFallbacks(
    discovered: string[],
    fallbacks: string[],
    targetCount: number
  ): string[] {
    const result = [...discovered];
    const needed = targetCount - result.length;

    if (needed > 0) {
      // Add fallbacks that aren't already in the list
      const available = fallbacks.filter(ticker => !result.includes(ticker));
      result.push(...available.slice(0, needed));
    }

    return result.slice(0, targetCount);
  }

  /**
   * Get fallback stocks when discovery fails
   */
  private getFallbackStocks(config: StockDiscoveryConfig): DiscoveredStocks {
    const largeCaps = this.fallbackTickers.largeCaps.slice(0, config.largeCaps);
    const midCaps = this.fallbackTickers.midCaps.slice(0, config.midCaps);
    const smallCaps = this.fallbackTickers.smallCaps.slice(0, config.smallCaps);

    return {
      largeCaps,
      midCaps,
      smallCaps,
      allTickers: [...largeCaps, ...midCaps, ...smallCaps],
    };
  }

  /**
   * Get curated high-quality stocks (for testing/demo)
   */
  getCuratedStocks(config: StockDiscoveryConfig): DiscoveredStocks {
    return this.getFallbackStocks(config);
  }
}

export const stockDiscovery = new StockDiscoveryService();
