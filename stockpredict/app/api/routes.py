from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from datetime import datetime
from loguru import logger
import math

from app.core.database import get_db


def sanitize_for_json(obj: Any) -> Any:
    """
    Recursively sanitize an object for JSON serialization.
    Replaces inf, -inf, and NaN with None.
    """
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj
from app.core.config import get_settings
from app.services.screener import Screener
from app.services.data_fetcher import DataFetcher
from app.ml.predictor import StockPredictor
from app.models import Stock, ScreeningScore, Prediction

settings = get_settings()
router = APIRouter()

@router.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Stock Prediction API",
        "version": settings.API_VERSION,
        "endpoints": {
            "candidates": "/api/candidates",
            "stock": "/api/stock/{ticker}",
            "screen": "/api/screen",
            "predict": "/api/predict/{ticker}",
            "health": "/health"
        }
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "api_version": settings.API_VERSION,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/api/candidates")
async def get_candidates(
    limit: int = Query(50, ge=1, le=500, description="Number of top candidates to return"),
    timeframe: str = Query("1m", description="Prediction timeframe (1w, 1m, 3m)"),
    min_score: float = Query(0, ge=0, le=100, description="Minimum composite score"),
    large_cap_count: int = Query(5, ge=1, le=50, description="Number of large cap stocks to return"),
    mid_cap_count: int = Query(5, ge=1, le=50, description="Number of mid cap stocks to return"),
    small_cap_count: int = Query(5, ge=1, le=50, description="Number of small cap stocks to return"),
    sector: Optional[str] = Query(None, description="Filter by sector (e.g., Technology, Healthcare)"),
    db: Session = Depends(get_db)
):
    """
    Get top N stock candidates with analysis, categorized by market cap
    
    Returns stocks ranked by composite score with:
    - Fundamental scores (growth, quality, value)
    - Technical scores (momentum)
    - ML predictions for specified timeframe
    - Full analysis breakdown
    - Categorized by market cap (large: >=$10B, mid: $2B-$10B, small: $300M-$2B)
    - Optional sector filtering
    """
    try:
        screener = Screener(db)
        predictor = StockPredictor(db)
        
        # Get top candidates from screener with optional sector filter
        logger.info(f"Getting candidates with sector={sector}, limit={limit}")
        candidates = screener.get_top_candidates(limit=limit * 2, sector=sector)  # Get more to filter
        logger.info(f"Got {len(candidates)} candidates from screener")
        
        # Filter by minimum score
        candidates = [c for c in candidates if c['composite_score'] >= min_score]
        
        # Categorize by market cap and add predictions
        large_caps = []
        mid_caps = []
        small_caps = []
        
        for candidate in candidates:
            ticker = candidate['ticker']
            market_cap = candidate.get('market_cap', 0) or 0
            
            # Get predictions
            try:
                predictions = predictor.get_stock_predictions(ticker)
            except Exception as pred_err:
                logger.warning(f"Error getting predictions for {ticker}: {pred_err}")
                predictions = {}
            
            # Add prediction for requested timeframe
            if timeframe in predictions:
                candidate['prediction'] = predictions[timeframe]
            else:
                candidate['prediction'] = None
            
            # Add all timeframe predictions
            candidate['all_predictions'] = predictions
            
            # Add market cap category label (standard thresholds)
            # Large cap: > $10B, Mid cap: $2B - $10B, Small cap: $300M - $2B
            if market_cap >= 10_000_000_000:  # >= $10B
                candidate['market_cap_category'] = 'large'
                if len(large_caps) < large_cap_count:
                    large_caps.append(candidate)
            elif market_cap >= 2_000_000_000:  # $2B - $10B
                candidate['market_cap_category'] = 'mid'
                if len(mid_caps) < mid_cap_count:
                    mid_caps.append(candidate)
            elif market_cap >= 300_000_000:  # $300M - $2B
                candidate['market_cap_category'] = 'small'
                if len(small_caps) < small_cap_count:
                    small_caps.append(candidate)
            # Skip micro caps (< $300M) as they're too risky/illiquid
            
            # Stop if we have enough of each category
            if (len(large_caps) >= large_cap_count and 
                len(mid_caps) >= mid_cap_count and 
                len(small_caps) >= small_cap_count):
                break
        
        # Combine all categories
        all_candidates = large_caps + mid_caps + small_caps
        
        # Sanitize for JSON (replace inf/nan with None)
        result = {
            "count": len(all_candidates),
            "timeframe": timeframe,
            "categories": {
                "large": len(large_caps),
                "mid": len(mid_caps),
                "small": len(small_caps)
            },
            "large_caps": sanitize_for_json(large_caps),
            "mid_caps": sanitize_for_json(mid_caps),
            "small_caps": sanitize_for_json(small_caps),
            "candidates": sanitize_for_json(all_candidates)  # Keep for backward compatibility
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error in get_candidates: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/stock/{ticker}")
async def get_stock_analysis(
    ticker: str,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analysis for a single stock
    
    Returns:
    - Basic stock information
    - Fundamental metrics
    - Technical indicators
    - Screening scores breakdown
    - ML predictions for all timeframes
    - Historical performance
    """
    try:
        ticker = ticker.upper()
        
        # Get stock information
        stock = db.query(Stock).filter(Stock.ticker == ticker).first()
        if not stock:
            raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
        
        # Get screening scores - use most recent date
        latest_screening = (
            db.query(ScreeningScore)
            .filter(ScreeningScore.ticker == ticker)
            .order_by(ScreeningScore.date.desc())
            .first()
        )
        
        # Get predictions
        predictor = StockPredictor(db)
        predictions = predictor.get_stock_predictions(ticker)
        
        # Build response
        result = {
            "ticker": ticker,
            "name": stock.name,
            "sector": stock.sector,
            "industry": stock.industry,
            "market_cap": stock.market_cap,
            "current_price": stock.current_price,
            "avg_volume": stock.avg_volume,
            "last_updated": stock.last_updated.isoformat() if stock.last_updated else None
        }
        
        # Add screening scores if available
        if latest_screening:
            result["screening"] = {
                "composite_score": latest_screening.composite_score,
                "rank": latest_screening.rank,
                "percentile": latest_screening.percentile,
                "passes_filters": bool(latest_screening.passes_basic_filters),
                "factor_scores": {
                    "growth": latest_screening.growth_score,
                    "quality": latest_screening.quality_score,
                    "value": latest_screening.value_score,
                    "momentum": latest_screening.momentum_score
                },
                "component_scores": {
                    "revenue_growth": latest_screening.revenue_growth_score,
                    "eps_growth": latest_screening.eps_growth_score,
                    "roe": latest_screening.roe_score,
                    "debt": latest_screening.debt_score,
                    "margin": latest_screening.margin_score,
                    "pe": latest_screening.pe_score,
                    "pb": latest_screening.pb_score,
                    "peg": latest_screening.peg_score,
                    "trend": latest_screening.trend_score,
                    "rsi": latest_screening.rsi_score,
                    "volume": latest_screening.volume_score
                }
            }
        else:
            result["screening"] = None
        
        # Add predictions
        result["predictions"] = predictions
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/screen")
async def custom_screen(
    min_market_cap: Optional[float] = Query(None, description="Minimum market cap"),
    min_score: Optional[float] = Query(None, description="Minimum composite score"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Custom screening with parameters
    
    Allows filtering stocks by:
    - Market cap
    - Composite score
    - Sector
    """
    try:
        today = datetime.now().date()
        
        # Build query
        query = db.query(ScreeningScore).filter(
            ScreeningScore.date == today,
            ScreeningScore.passes_basic_filters == 1.0
        )
        
        # Apply filters
        if min_score:
            query = query.filter(ScreeningScore.composite_score >= min_score)
        
        # Get results
        scores = query.order_by(ScreeningScore.composite_score.desc()).limit(limit).all()
        
        results = []
        for score in scores:
            stock = db.query(Stock).filter(Stock.ticker == score.ticker).first()
            
            # Apply additional filters
            if min_market_cap and (not stock or stock.market_cap < min_market_cap):
                continue
            
            if sector and (not stock or stock.sector != sector):
                continue
            
            results.append({
                "ticker": score.ticker,
                "name": stock.name if stock else "",
                "sector": stock.sector if stock else "",
                "market_cap": stock.market_cap if stock else None,
                "current_price": stock.current_price if stock else None,
                "composite_score": score.composite_score,
                "rank": score.rank,
                "scores": {
                    "growth": score.growth_score,
                    "quality": score.quality_score,
                    "value": score.value_score,
                    "momentum": score.momentum_score
                }
            })
        
        return {
            "count": len(results),
            "filters": {
                "min_market_cap": min_market_cap,
                "min_score": min_score,
                "sector": sector
            },
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/predict/{ticker}")
async def predict_stock(
    ticker: str,
    db: Session = Depends(get_db)
):
    """
    Generate on-demand predictions for a specific stock
    
    This will:
    1. Fetch latest data if needed
    2. Calculate indicators
    3. Run screening
    4. Generate ML predictions
    """
    try:
        ticker = ticker.upper()
        
        # Check if stock exists
        stock = db.query(Stock).filter(Stock.ticker == ticker).first()
        
        # Fetch data if needed
        data_fetcher = DataFetcher(db)
        if not stock or (datetime.utcnow() - stock.last_updated).days > 0:
            success = data_fetcher.fetch_single_stock(ticker)
            if not success:
                raise HTTPException(status_code=404, detail=f"Could not fetch data for {ticker}")
        
        # Calculate indicators
        from app.services.feature_engineer import FeatureEngineer
        engineer = FeatureEngineer(db)
        engineer.calculate_all_indicators(ticker)
        
        # Run screening
        screener = Screener(db)
        screener.screen_stock(ticker)
        
        # Generate predictions
        predictor = StockPredictor(db)
        predictions = predictor.predict_all_timeframes(ticker)
        
        # Save predictions
        for timeframe, pred in predictions.items():
            predictor.save_prediction(ticker, timeframe, pred)
        
        return {
            "ticker": ticker,
            "status": "success",
            "predictions": predictions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/sectors")
async def get_sectors(db: Session = Depends(get_db)):
    """Get list of available sectors"""
    try:
        sectors = db.query(Stock.sector).distinct().filter(Stock.sector.isnot(None)).all()
        return {
            "sectors": [s[0] for s in sectors if s[0]]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    """API health check"""
    try:
        # Check database connection
        db.execute("SELECT 1")
        
        # Check if we have data
        stock_count = db.query(Stock).count()
        
        today = datetime.now().date()
        screening_count = db.query(ScreeningScore).filter(
            ScreeningScore.date == today
        ).count()
        
        prediction_count = db.query(Prediction).filter(
            Prediction.date == today
        ).count()
        
        return {
            "status": "healthy",
            "database": "connected",
            "stats": {
                "total_stocks": stock_count,
                "screened_today": screening_count,
                "predictions_today": prediction_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")
