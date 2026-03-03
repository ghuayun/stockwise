"""
Daily update script - Run after market close to update all data
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from app.core.database import SessionLocal
from app.services.data_fetcher import DataFetcher
from app.services.feature_engineer import FeatureEngineer
from app.services.screener import Screener
from app.ml.predictor import StockPredictor

def run_daily_update():
    """Execute daily update pipeline"""
    logger.info("=" * 80)
    logger.info("Starting daily update pipeline")
    logger.info("=" * 80)
    
    db = SessionLocal()
    
    try:
        # Step 1: Fetch latest stock data
        logger.info("Step 1: Fetching stock data from YFinance...")
        data_fetcher = DataFetcher(db)
        data_fetcher.fetch_all_nasdaq_data()
        logger.info("✓ Data fetching completed")
        
        # Step 2: Calculate technical indicators
        logger.info("Step 2: Calculating technical indicators...")
        feature_engineer = FeatureEngineer(db)
        feature_engineer.calculate_all_stocks_indicators()
        logger.info("✓ Technical indicators calculated")
        
        # Step 3: Run screening and scoring
        logger.info("Step 3: Running stock screening...")
        screener = Screener(db)
        screener.screen_all_stocks()
        logger.info("✓ Screening completed")
        
        # Step 4: Generate ML predictions
        logger.info("Step 4: Generating ML predictions...")
        predictor = StockPredictor(db)
        predictor.predict_all_stocks()
        logger.info("✓ Predictions generated")
        
        logger.info("=" * 80)
        logger.info("Daily update completed successfully!")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"Error during daily update: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_daily_update()
