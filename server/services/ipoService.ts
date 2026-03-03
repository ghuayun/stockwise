import type { InsertUpcomingIPO } from "@shared/schema";

export class IPOService {
  private readonly apiKey: string;
  
  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FINNHUB_API_KEY not set - IPO data will not be available');
    }
  }

  /**
   * Fetches upcoming IPOs from Finnhub API for the next month
   */
  async fetchUpcomingIPOs(): Promise<InsertUpcomingIPO[]> {
    if (!this.apiKey) {
      console.error('No Finnhub API key configured');
      return [];
    }

    try {
      // Calculate date range: today to +30 days
      const today = new Date();
      const fromDate = this.formatDate(today);
      
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);
      const toDate = this.formatDate(futureDate);

      const url = `https://finnhub.io/api/v1/calendar/ipo?from=${fromDate}&to=${toDate}&token=${this.apiKey}`;
      
      console.log(`Fetching IPOs from Finnhub: ${fromDate} to ${toDate}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Finnhub API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const ipoCalendar = data.ipoCalendar || [];
      
      console.log(`Received ${ipoCalendar.length} IPOs from Finnhub`);

      const ipos: InsertUpcomingIPO[] = [];
      
      for (const ipo of ipoCalendar) {
        try {
          const companyName = ipo.name || '';
          const ticker = ipo.symbol || '';
          const ipoDate = ipo.date || '';
          const exchange = ipo.exchange || '';
          const numberOfShares = ipo.numberOfShares || 0;
          const price = ipo.price || '';
          const totalSharesValue = ipo.totalSharesValue || 0;

          if (!companyName || companyName.length < 2) continue;

          // Format price range
          let priceRange = "TBD";
          if (price) {
            priceRange = `$${price}`;
          }

          // Calculate expected valuation
          let expectedValuation = "TBD";
          if (totalSharesValue > 0) {
            // totalSharesValue is typically in dollars
            const valuationInBillions = totalSharesValue / 1_000_000_000;
            if (valuationInBillions >= 1) {
              expectedValuation = `$${valuationInBillions.toFixed(1)}B`;
            } else {
              const valuationInMillions = totalSharesValue / 1_000_000;
              expectedValuation = `$${valuationInMillions.toFixed(0)}M`;
            }
          } else if (numberOfShares > 0 && price) {
            // Estimate from shares * price
            const priceNum = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
            if (!isNaN(priceNum)) {
              const estimatedValue = numberOfShares * priceNum;
              const valuationInBillions = estimatedValue / 1_000_000_000;
              if (valuationInBillions >= 1) {
                expectedValuation = `$${valuationInBillions.toFixed(1)}B`;
              } else {
                const valuationInMillions = estimatedValue / 1_000_000;
                expectedValuation = `$${valuationInMillions.toFixed(0)}M`;
              }
            }
          }

          // Determine sector from company name
          const sector = this.determineSector(companyName);

          // Format display date
          const displayDate = this.formatDisplayDate(ipoDate);

          ipos.push({
            companyName,
            ticker: ticker || `${companyName.substring(0, 3).toUpperCase()}`,
            ipoDate: displayDate,
            priceRange,
            expectedValuation,
            sector,
            interest: this.determineInterest(expectedValuation, sector),
            description: `${companyName} is scheduled to go public on ${exchange || 'the stock exchange'}.`,
          });
        } catch (error) {
          console.error('Error parsing IPO from Finnhub:', error);
        }
      }

      console.log(`Successfully processed ${ipos.length} upcoming IPOs`);
      return ipos;
    } catch (error) {
      console.error('Failed to fetch IPOs from Finnhub:', error);
      return [];
    }
  }

  /**
   * Format date to YYYY-MM-DD for Finnhub API
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format date for display (e.g., "Oct 15, 2025")
   */
  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'TBD';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      
      return `${month} ${day}, ${year}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Determine sector from company name
   */
  private determineSector(companyName: string): string {
    const name = companyName.toLowerCase();
    
    if (name.includes('bio') || name.includes('pharma') || name.includes('therapeut') || name.includes('medical')) {
      return 'Biotech';
    }
    if (name.includes('bank') || name.includes('financial') || name.includes('capital') || name.includes('payment')) {
      return 'Fintech';
    }
    if (name.includes('energy') || name.includes('oil') || name.includes('solar') || name.includes('renewable')) {
      return 'Energy';
    }
    if (name.includes('retail') || name.includes('consumer') || name.includes('food') || name.includes('restaurant')) {
      return 'Consumer';
    }
    
    return 'Technology';
  }

  /**
   * Determines interest level based on valuation and sector
   */
  private determineInterest(valuation: string, sector: string): "high" | "medium" | "low" {
    const valuationNum = this.parseValuation(valuation);
    
    const hotSectors = ['Fintech', 'Biotech', 'Technology'];
    const isHotSector = hotSectors.includes(sector);
    
    if (valuationNum > 10 || isHotSector) return "high";
    if (valuationNum > 2) return "medium";
    return "low";
  }

  /**
   * Parse valuation string to numeric value in billions
   */
  private parseValuation(valuation: string): number {
    const match = valuation.match(/\$?([\d.]+)([BM])/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    return unit === 'B' ? value : value / 1000;
  }
}

export const ipoService = new IPOService();
