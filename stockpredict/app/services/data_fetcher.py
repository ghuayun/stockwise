import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from loguru import logger
import time

from app.models import Stock, DailyData, Fundamental
from app.core.config import get_settings

settings = get_settings()

class DataFetcher:
    """Service for fetching stock data from YFinance"""
    
    def __init__(self, db: Session):
        self.db = db
        self.batch_size = settings.BATCH_SIZE
        self.data_months = settings.DATA_MONTHS
    
    def get_nasdaq_tickers(self) -> List[str]:
        """Get all NASDAQ stock tickers"""
        try:
            logger.info("Fetching NASDAQ tickers...")
            
            # Try multiple methods in order of preference
            tickers = []
            
            # Method 1: Try NASDAQ FTP (official source)
            tickers = self._fetch_from_nasdaq_ftp()
            if tickers:
                logger.info(f"✓ Found {len(tickers)} NASDAQ tickers from FTP")
                return tickers
            
            # Method 2: Try using pandas_datareader
            tickers = self._fetch_from_pandas_datareader()
            if tickers:
                logger.info(f"✓ Found {len(tickers)} NASDAQ tickers from pandas_datareader")
                return tickers
            
            # Method 3: Try web scraping from official NASDAQ website
            tickers = self._fetch_from_nasdaq_api()
            if tickers:
                logger.info(f"✓ Found {len(tickers)} NASDAQ tickers from NASDAQ API")
                return tickers
            
            # Method 4: Try Wikipedia list as last resort
            tickers = self._fetch_from_wikipedia()
            if tickers:
                logger.info(f"✓ Found {len(tickers)} NASDAQ tickers from Wikipedia")
                return tickers
            
            logger.error("All ticker fetching methods failed")
            return []
            
        except Exception as e:
            logger.error(f"Error fetching NASDAQ tickers: {e}")
            return []
    
    def _fetch_from_nasdaq_ftp(self) -> List[str]:
        """Fetch tickers from NASDAQ FTP server"""
        try:
            import pandas as pd
            url = "ftp://ftp.nasdaqtrader.com/symboldirectory/nasdaqlisted.txt"
            df = pd.read_csv(url, sep="|")
            tickers = df[df['Test Issue'] == 'N']['Symbol'].tolist()
            # Remove last row which is usually file creation time
            return [t for t in tickers if t and not t.startswith('File') and len(t) <= 5]
        except Exception as e:
            logger.debug(f"NASDAQ FTP fetch failed: {e}")
            return []
    
    def _fetch_from_pandas_datareader(self) -> List[str]:
        """Fetch tickers using pandas_datareader"""
        try:
            import pandas as pd
            # Try alternative URL for NASDAQ listed stocks
            url = "http://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt"
            df = pd.read_csv(url, sep="|")
            # Filter out test issues
            tickers = df[df['Test Issue'] == 'N']['Symbol'].tolist()
            return [t for t in tickers if t and not t.startswith('File') and len(t) <= 5]
        except Exception as e:
            logger.debug(f"Pandas datareader fetch failed: {e}")
            return []
    
    def _fetch_from_nasdaq_api(self) -> List[str]:
        """Fetch tickers from NASDAQ API"""
        try:
            import requests
            import json
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            url = "https://api.nasdaq.com/api/screener/stocks"
            params = {
                'tableonly': 'true',
                'limit': 25,
                'offset': 0,
                'exchange': 'NASDAQ',
                'download': 'true'
            }
            
            tickers = []
            offset = 0
            
            while offset < 5000:  # NASDAQ has ~3000-4000 stocks
                params['offset'] = offset
                response = requests.get(url, params=params, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'data' in data and 'rows' in data['data']:
                        rows = data['data']['rows']
                        if not rows:
                            break
                        
                        for row in rows:
                            if 'symbol' in row:
                                ticker = row['symbol'].strip()
                                if ticker and len(ticker) <= 5:
                                    tickers.append(ticker)
                        
                        offset += len(rows)
                    else:
                        break
                else:
                    break
                
                # Small delay to avoid rate limiting
                time.sleep(0.5)
            
            return list(set(tickers))  # Remove duplicates
        except Exception as e:
            logger.debug(f"NASDAQ API fetch failed: {e}")
            return []
    
    def _fetch_from_wikipedia(self) -> List[str]:
        """Fetch NASDAQ-100 tickers from Wikipedia as fallback"""
        try:
            import pandas as pd
            # Get NASDAQ-100 as a starting point
            url = "https://en.wikipedia.org/wiki/NASDAQ-100"
            tables = pd.read_html(url)
            
            tickers = []
            for table in tables:
                if 'Ticker' in table.columns or 'Symbol' in table.columns:
                    ticker_col = 'Ticker' if 'Ticker' in table.columns else 'Symbol'
                    tickers.extend(table[ticker_col].tolist())
            
            return [t.strip() for t in tickers if isinstance(t, str) and t.strip() and len(t.strip()) <= 5]
        except Exception as e:
            logger.debug(f"Wikipedia fetch failed: {e}")
            return []
    
    def fetch_stock_batch(self, tickers: List[str]) -> Dict[str, pd.DataFrame]:
        """Fetch data for a batch of tickers with rate limit handling"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                logger.info(f"Fetching batch of {len(tickers)} tickers (attempt {retry_count + 1}/{max_retries})")
                
                # Calculate date range
                end_date = datetime.now()
                start_date = end_date - timedelta(days=self.data_months * 30 + 60)  # Extra days for indicators
                
                # Download data for all tickers at once
                data = yf.download(
                    tickers,
                    start=start_date,
                    end=end_date,
                    group_by='ticker',
                    threads=True,
                    progress=False
                )
                
                # Handle single ticker case
                if len(tickers) == 1:
                    return {tickers[0]: data}
                
                # Parse into dictionary
                result = {}
                for ticker in tickers:
                    try:
                        if ticker in data.columns.levels[0]:
                            ticker_data = data[ticker]
                            if not ticker_data.empty:
                                result[ticker] = ticker_data
                    except:
                        logger.warning(f"Could not extract data for {ticker}")
                        continue
                
                return result
                
            except Exception as e:
                error_msg = str(e).lower()
                
                # Check if it's a rate limit error
                if 'rate limit' in error_msg or '429' in error_msg or 'too many requests' in error_msg:
                    retry_count += 1
                    if retry_count < max_retries:
                        logger.warning(f"Rate limit hit, sleeping for 5 seconds before retry {retry_count + 1}/{max_retries}")
                        time.sleep(5)
                    else:
                        logger.error(f"Rate limit exceeded after {max_retries} retries for batch")
                        return {}
                else:
                    # For other errors, log and return empty result
                    logger.error(f"Error fetching batch: {e}")
                    return {}
        
        return {}
    
    def fetch_stock_info(self, ticker: str) -> Optional[Dict]:
        """Fetch detailed stock information"""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            return info
        except Exception as e:
            logger.warning(f"Error fetching info for {ticker}: {e}")
            return None
    
    def save_stock_data(self, ticker: str, data: pd.DataFrame, info: Optional[Dict] = None):
        """Save stock data to database"""
        try:
            # Save or update stock master record
            stock = self.db.query(Stock).filter(Stock.ticker == ticker).first()
            
            if not stock:
                stock = Stock(ticker=ticker)
                self.db.add(stock)
            
            # Update stock info if available
            if info:
                stock.name = info.get('longName', ticker)
                stock.sector = info.get('sector')
                stock.industry = info.get('industry')
                stock.market_cap = info.get('marketCap')
            
            # Calculate average volume from recent data
            if not data.empty and 'Volume' in data.columns:
                stock.avg_volume = data['Volume'].tail(20).mean()
                stock.current_price = data['Close'].iloc[-1] if 'Close' in data.columns else None
            
            stock.last_updated = datetime.utcnow()
            
            # Save daily data
            self._save_daily_data(ticker, data)
            
            # Save fundamentals if info available
            if info:
                self._save_fundamentals(ticker, info)
            
            self.db.commit()
            logger.info(f"Saved data for {ticker}")
            
        except Exception as e:
            logger.error(f"Error saving data for {ticker}: {e}")
            self.db.rollback()
    
    def _save_daily_data(self, ticker: str, data: pd.DataFrame):
        """Save daily OHLCV data"""
        try:
            for date, row in data.iterrows():
                record_id = f"{ticker}_{date.date()}"
                
                daily = self.db.query(DailyData).filter(DailyData.id == record_id).first()
                if not daily:
                    daily = DailyData(id=record_id, ticker=ticker, date=date.date())
                    self.db.add(daily)
                
                daily.open = float(row.get('Open', 0)) if not pd.isna(row.get('Open')) else None
                daily.high = float(row.get('High', 0)) if not pd.isna(row.get('High')) else None
                daily.low = float(row.get('Low', 0)) if not pd.isna(row.get('Low')) else None
                daily.close = float(row.get('Close', 0)) if not pd.isna(row.get('Close')) else None
                daily.volume = float(row.get('Volume', 0)) if not pd.isna(row.get('Volume')) else None
                daily.adj_close = float(row.get('Adj Close', row.get('Close', 0))) if not pd.isna(row.get('Adj Close', row.get('Close'))) else None
                
        except Exception as e:
            logger.error(f"Error saving daily data for {ticker}: {e}")
    
    def _save_fundamentals(self, ticker: str, info: Dict):
        """Save fundamental data"""
        try:
            date = datetime.now().date()
            record_id = f"{ticker}_{date}"
            
            fundamental = self.db.query(Fundamental).filter(Fundamental.id == record_id).first()
            if not fundamental:
                fundamental = Fundamental(id=record_id, ticker=ticker, date=date)
                self.db.add(fundamental)
            
            # Valuation metrics
            fundamental.pe_ratio = info.get('trailingPE')
            fundamental.forward_pe = info.get('forwardPE')
            fundamental.pb_ratio = info.get('priceToBook')
            fundamental.ps_ratio = info.get('priceToSalesTrailing12Months')
            fundamental.peg_ratio = info.get('pegRatio')
            
            # Growth metrics
            fundamental.revenue_growth = info.get('revenueGrowth')
            fundamental.earnings_growth = info.get('earningsGrowth')
            
            # Quality metrics
            fundamental.roe = info.get('returnOnEquity')
            fundamental.roa = info.get('returnOnAssets')
            fundamental.debt_to_equity = info.get('debtToEquity')
            fundamental.current_ratio = info.get('currentRatio')
            fundamental.quick_ratio = info.get('quickRatio')
            
            # Profitability metrics
            fundamental.gross_margin = info.get('grossMargins')
            fundamental.operating_margin = info.get('operatingMargins')
            fundamental.profit_margin = info.get('profitMargins')
            fundamental.free_cash_flow = info.get('freeCashflow')
            fundamental.operating_cash_flow = info.get('operatingCashflow')
            
            # Additional metrics
            fundamental.book_value = info.get('bookValue')
            fundamental.enterprise_value = info.get('enterpriseValue')
            fundamental.shares_outstanding = info.get('sharesOutstanding')
            
        except Exception as e:
            logger.error(f"Error saving fundamentals for {ticker}: {e}")
    
    def fetch_all_nasdaq_data(self):
        """Fetch data for all NASDAQ stocks in batches"""
        try:
            tickers = self.get_nasdaq_tickers()
            
            if not tickers:
                logger.error("No tickers to fetch")
                return
            
            # Process in batches
            total_batches = (len(tickers) + self.batch_size - 1) // self.batch_size
            
            for i in range(0, len(tickers), self.batch_size):
                batch = tickers[i:i + self.batch_size]
                batch_num = i // self.batch_size + 1
                
                logger.info(f"Processing batch {batch_num}/{total_batches}")
                
                # Fetch batch data
                batch_data = self.fetch_stock_batch(batch)
                
                # Save each ticker's data
                for ticker in batch:
                    if ticker in batch_data:
                        info = self.fetch_stock_info(ticker)
                        self.save_stock_data(ticker, batch_data[ticker], info)
                    
                    # Small delay to respect rate limits
                    time.sleep(0.1)
                
                # Delay between batches
                if batch_num < total_batches:
                    logger.info("Waiting 2 seconds before next batch...")
                    time.sleep(2)
            
            logger.info("Completed fetching all NASDAQ data")
            
        except Exception as e:
            logger.error(f"Error in fetch_all_nasdaq_data: {e}")
    
    def fetch_single_stock(self, ticker: str):
        """Fetch data for a single stock (on-demand during trading hours)"""
        try:
            logger.info(f"Fetching data for {ticker}")
            
            # Fetch data
            batch_data = self.fetch_stock_batch([ticker])
            
            if ticker in batch_data:
                info = self.fetch_stock_info(ticker)
                self.save_stock_data(ticker, batch_data[ticker], info)
                logger.info(f"Successfully fetched and saved {ticker}")
                return True
            else:
                logger.warning(f"No data found for {ticker}")
                return False
                
        except Exception as e:
            logger.error(f"Error fetching single stock {ticker}: {e}")
            return False
