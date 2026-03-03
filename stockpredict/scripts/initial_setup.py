"""
Initial setup script - Fetch a subset of stocks for testing

This script fetches data for popular NASDAQ stocks to get started quickly.
For full NASDAQ coverage, use daily_update.py after initial setup.
"""
import sys
import time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from app.core.database import SessionLocal, init_db
from app.services.data_fetcher import DataFetcher
from app.services.feature_engineer import FeatureEngineer
from app.services.screener import Screener

# Popular NASDAQ stocks for initial testing
TEST_TICKERS = [
    # Start with just a few reliable stocks
    'MSFT', 'GOOGL', 'NVDA'
]

def run_initial_setup():
    """Run initial setup with sample stocks"""
    logger.info("=" * 80)
    logger.info("Starting initial setup with sample NASDAQ stocks")
    logger.info("=" * 80)
    
    # Initialize database
    logger.info("Initializing database...")
    init_db()
    logger.info("✓ Database initialized")
    
    db = SessionLocal()
    
    try:
        logger.info(f"\nFetching data for {len(TEST_TICKERS)} stocks...")
        logger.info(f"Tickers: {', '.join(TEST_TICKERS[:10])}...")
        
        # Step 1: Fetch stock data
        logger.info("\nStep 1: Fetching stock data from YFinance...")
        data_fetcher = DataFetcher(db)
        
        successful = 0
        failed = 0
        
        for i, ticker in enumerate(TEST_TICKERS, 1):
            try:
                logger.info(f"[{i}/{len(TEST_TICKERS)}] Fetching {ticker}...")
                
                # Fetch data for single stock
                batch_data = data_fetcher.fetch_stock_batch([ticker])
                
                if ticker in batch_data and not batch_data[ticker].empty:
                    try:
                        info = data_fetcher.fetch_stock_info(ticker)
                        data_fetcher.save_stock_data(ticker, batch_data[ticker], info)
                        successful += 1
                        logger.info(f"✓ {ticker} - Success")
                    except Exception as save_error:
                        logger.error(f"✗ {ticker} - Save error: {save_error}")
                        failed += 1
                else:
                    failed += 1
                    logger.warning(f"✗ {ticker} - No data available")
                
                # Small delay to avoid rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                failed += 1
                logger.error(f"✗ {ticker} - Error: {e}")
        
        logger.info(f"\nData fetching completed: {successful} successful, {failed} failed")
        
        # Step 2: Calculate technical indicators
        logger.info("\nStep 2: Calculating technical indicators...")
        feature_engineer = FeatureEngineer(db)
        
        for i, ticker in enumerate(TEST_TICKERS, 1):
            try:
                logger.info(f"[{i}/{len(TEST_TICKERS)}] Calculating indicators for {ticker}...")
                feature_engineer.calculate_all_indicators(ticker)
            except Exception as e:
                logger.error(f"Error calculating indicators for {ticker}: {e}")
        
        logger.info("✓ Technical indicators calculated")
        
        # Step 3: Run screening
        logger.info("\nStep 3: Running stock screening...")
        screener = Screener(db)
        
        for i, ticker in enumerate(TEST_TICKERS, 1):
            try:
                logger.info(f"[{i}/{len(TEST_TICKERS)}] Screening {ticker}...")
                screener.screen_stock(ticker)
            except Exception as e:
                logger.error(f"Error screening {ticker}: {e}")
        
        # Calculate rankings
        screener.calculate_rankings()
        logger.info("✓ Screening completed")
        
        # Step 4: Show top candidates
        logger.info("\n" + "=" * 80)
        logger.info("TOP 10 CANDIDATES")
        logger.info("=" * 80)
        
        top_candidates = screener.get_top_candidates(limit=10)
        
        for i, candidate in enumerate(top_candidates, 1):
            logger.info(f"\n{i}. {candidate['ticker']} - {candidate['name']}")
            logger.info(f"   Composite Score: {candidate['composite_score']:.2f}")
            logger.info(f"   Rank: {candidate['rank']}")
            logger.info(f"   Scores - Growth: {candidate['scores']['growth']:.1f}, "
                       f"Quality: {candidate['scores']['quality']:.1f}, "
                       f"Value: {candidate['scores']['value']:.1f}, "
                       f"Momentum: {candidate['scores']['momentum']:.1f}")
        
        logger.info("\n" + "=" * 80)
        logger.info("Initial setup completed successfully!")
        logger.info("=" * 80)
        logger.info("\nNext steps:")
        logger.info("1. Train ML models: python scripts/train_models.py")
        logger.info("2. Start API server: python main.py")
        logger.info("3. Access docs at: http://localhost:8000/docs")
        logger.info("\nFor full NASDAQ coverage, run: python scripts/daily_update.py")
        
    except Exception as e:
        logger.error(f"Error during initial setup: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_initial_setup()
