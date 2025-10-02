import yahooFinance from "yahoo-finance2";

export interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  marketCap: number;
  regularMarketVolume: number;
  trailingPE?: number;
  shortName?: string;
  longName?: string;
}

export interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  pe: number;
  volume: string;
  marketCap: number;
  marketCapFormatted: string;
  institutionalHolding: number;
}

export class YahooFinanceService {
  async getStockQuote(ticker: string): Promise<StockQuote | null> {
    try {
      const quote = await yahooFinance.quote(ticker);
      return {
        symbol: quote.symbol,
        regularMarketPrice: quote.regularMarketPrice || 0,
        regularMarketChange: quote.regularMarketChange || 0,
        regularMarketChangePercent: quote.regularMarketChangePercent || 0,
        marketCap: quote.marketCap || 0,
        regularMarketVolume: quote.regularMarketVolume || 0,
        trailingPE: quote.trailingPE,
        shortName: quote.shortName,
        longName: quote.longName,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${ticker}:`, error);
      return null;
    }
  }

  async getStockData(ticker: string): Promise<StockData | null> {
    try {
      const quote = await this.getStockQuote(ticker);
      if (!quote) return null;

      const companyName = quote.longName || quote.shortName || ticker;
      const marketCap = quote.marketCap;
      
      const institutionalHolding = 0;

      return {
        ticker: quote.symbol,
        companyName,
        currentPrice: quote.regularMarketPrice,
        priceChange: quote.regularMarketChange,
        priceChangePercent: quote.regularMarketChangePercent,
        pe: quote.trailingPE || 0,
        volume: this.formatVolume(quote.regularMarketVolume),
        marketCap,
        marketCapFormatted: this.formatMarketCap(marketCap),
        institutionalHolding,
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${ticker}:`, error);
      return null;
    }
  }

  async getBatchStockData(tickers: string[]): Promise<StockData[]> {
    const promises = tickers.map((ticker) => this.getStockData(ticker));
    const results = await Promise.all(promises);
    return results.filter((data): data is StockData => data !== null);
  }

  formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toFixed(0)}`;
  }

  formatVolume(volume: number): string {
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`;
    }
    return volume.toString();
  }

  getMarketCapCategory(marketCap: number): "large" | "mid" | "small" {
    if (marketCap >= 200e9) return "large"; // >= $200B
    if (marketCap >= 10e9) return "mid";    // $10B - $200B
    return "small";                          // < $10B
  }
}

export const yahooFinanceService = new YahooFinanceService();
