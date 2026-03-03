import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from loguru import logger
from datetime import datetime, date
from scipy import stats

from app.models import Stock, Fundamental, TechnicalIndicator, ScreeningScore
from app.core.config import get_settings

settings = get_settings()

class Screener:
    """Service for screening and scoring stocks"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def apply_basic_filters(self) -> List[str]:
        """
        Layer A: Apply basic filters to eliminate junk stocks
        Returns list of tickers that pass basic filters
        """
        try:
            logger.info("Applying basic filters...")
            
            # Query stocks that pass basic filters
            passing_stocks = (
                self.db.query(Stock.ticker)
                .filter(
                    Stock.is_active == True,
                    Stock.market_cap >= settings.MIN_MARKET_CAP,
                    Stock.avg_volume >= settings.MIN_AVG_VOLUME,
                    Stock.current_price >= settings.MIN_PRICE
                )
                .all()
            )
            
            tickers = [stock.ticker for stock in passing_stocks]
            logger.info(f"{len(tickers)} stocks passed basic filters")
            
            return tickers
            
        except Exception as e:
            logger.error(f"Error applying basic filters: {e}")
            return []
    
    def score_growth_factors(self, ticker: str, fundamental: Fundamental) -> Dict[str, float]:
        """Score growth-related factors (0-100 scale)"""
        scores = {
            'revenue_growth': 0.0,
            'eps_growth': 0.0,
            'overall_growth': 0.0
        }
        
        try:
            # Revenue growth score
            if fundamental.revenue_growth:
                rev_growth = fundamental.revenue_growth * 100  # Convert to percentage
                if rev_growth >= settings.MIN_REVENUE_GROWTH * 100:
                    # Score based on growth rate (10% = 50, 30%+ = 100)
                    scores['revenue_growth'] = min(100, 50 + (rev_growth - 10) * 2.5)
            
            # EPS growth score
            if fundamental.eps_growth_3y:
                eps_growth = fundamental.eps_growth_3y
                if eps_growth > 0:
                    # Positive EPS growth gets higher scores
                    scores['eps_growth'] = min(100, 50 + eps_growth * 50)
            elif fundamental.earnings_growth and fundamental.earnings_growth > 0:
                scores['eps_growth'] = min(100, 50 + fundamental.earnings_growth * 50)
            
            # Overall growth score (average)
            scores['overall_growth'] = np.mean([
                scores['revenue_growth'],
                scores['eps_growth']
            ])
            
        except Exception as e:
            logger.warning(f"Error scoring growth for {ticker}: {e}")
        
        return scores
    
    def score_quality_factors(self, ticker: str, fundamental: Fundamental) -> Dict[str, float]:
        """Score quality-related factors (0-100 scale)"""
        scores = {
            'roe': 0.0,
            'debt': 0.0,
            'margin': 0.0,
            'overall_quality': 0.0
        }
        
        try:
            # ROE score
            if fundamental.roe:
                roe = fundamental.roe * 100  # Convert to percentage
                if roe >= settings.MIN_ROE * 100:
                    # ROE 10% = 50, 20%+ = 100
                    scores['roe'] = min(100, 50 + (roe - 10) * 5)
            
            # Debt score (lower is better)
            if fundamental.debt_to_equity is not None:
                debt_ratio = fundamental.debt_to_equity
                if debt_ratio <= settings.MAX_DEBT_EQUITY:
                    # 0 debt = 100, 1.0 debt = 50
                    scores['debt'] = 100 - (debt_ratio * 50)
            
            # Margin score
            margins = []
            if fundamental.gross_margin:
                margins.append(fundamental.gross_margin * 100)
            if fundamental.operating_margin:
                margins.append(fundamental.operating_margin * 100)
            if fundamental.profit_margin:
                margins.append(fundamental.profit_margin * 100)
            
            if margins:
                avg_margin = np.mean(margins)
                # Margin 10% = 50, 30%+ = 100
                scores['margin'] = min(100, max(0, avg_margin * 3))
            
            # Overall quality score
            scores['overall_quality'] = np.mean([
                scores['roe'],
                scores['debt'],
                scores['margin']
            ])
            
        except Exception as e:
            logger.warning(f"Error scoring quality for {ticker}: {e}")
        
        return scores
    
    def score_value_factors(self, ticker: str, fundamental: Fundamental) -> Dict[str, float]:
        """Score valuation factors (0-100 scale)"""
        scores = {
            'pe': 0.0,
            'pb': 0.0,
            'peg': 0.0,
            'overall_value': 0.0
        }
        
        try:
            # P/E score (optimal range: 5-40)
            if fundamental.pe_ratio:
                pe = fundamental.pe_ratio
                if settings.MIN_PE_RATIO <= pe <= settings.MAX_PE_RATIO:
                    # P/E of 15 = 100, higher or lower = lower score
                    optimal_pe = 15
                    deviation = abs(pe - optimal_pe) / optimal_pe
                    scores['pe'] = max(0, 100 - (deviation * 100))
            
            # P/B score (lower is better, but not too low)
            if fundamental.pb_ratio:
                pb = fundamental.pb_ratio
                if pb <= settings.MAX_PB_RATIO:
                    # P/B 1-2 = 100, higher = lower score
                    if pb <= 2:
                        scores['pb'] = 100
                    else:
                        scores['pb'] = max(0, 100 - ((pb - 2) * 20))
            
            # PEG score (< 1 is great, 1-2 is good)
            if fundamental.peg_ratio:
                peg = fundamental.peg_ratio
                if peg <= 1:
                    scores['peg'] = 100
                elif peg <= 2:
                    scores['peg'] = 100 - ((peg - 1) * 50)
                else:
                    scores['peg'] = max(0, 50 - ((peg - 2) * 25))
            
            # Overall value score
            valid_scores = [s for s in [scores['pe'], scores['pb'], scores['peg']] if s > 0]
            if valid_scores:
                scores['overall_value'] = np.mean(valid_scores)
            
        except Exception as e:
            logger.warning(f"Error scoring value for {ticker}: {e}")
        
        return scores
    
    def score_momentum_factors(self, ticker: str, technical: TechnicalIndicator, 
                               stock: Stock) -> Dict[str, float]:
        """Score momentum and technical factors (0-100 scale)"""
        scores = {
            'trend': 0.0,
            'rsi': 0.0,
            'volume': 0.0,
            'overall_momentum': 0.0
        }
        
        try:
            # Trend score (price vs moving averages)
            if technical.sma_200 and stock.current_price:
                price = stock.current_price
                sma_200 = technical.sma_200
                
                # Price above 200-day MA is positive
                if price > sma_200:
                    scores['trend'] += 50
                
                # Golden cross (50 > 200)
                if technical.sma_50 and technical.sma_50 > sma_200:
                    scores['trend'] += 50
            
            # RSI score (optimal range: 40-70)
            if technical.rsi:
                rsi = technical.rsi
                if settings.MIN_RSI <= rsi <= settings.MAX_RSI:
                    # RSI of 55 = 100, edges of range = 50
                    optimal_rsi = 55
                    if rsi <= optimal_rsi:
                        scores['rsi'] = 50 + ((rsi - settings.MIN_RSI) / (optimal_rsi - settings.MIN_RSI) * 50)
                    else:
                        scores['rsi'] = 100 - ((rsi - optimal_rsi) / (settings.MAX_RSI - optimal_rsi) * 50)
            
            # Volume score (current vs average)
            if technical.volume_sma_20 and stock.avg_volume:
                # If recent volume is above average, it's bullish
                volume_ratio = stock.avg_volume / technical.volume_sma_20
                if volume_ratio >= 1.0:
                    scores['volume'] = min(100, 50 + (volume_ratio - 1) * 100)
                else:
                    scores['volume'] = volume_ratio * 50
            
            # Overall momentum score
            scores['overall_momentum'] = np.mean([
                scores['trend'],
                scores['rsi'],
                scores['volume']
            ])
            
        except Exception as e:
            logger.warning(f"Error scoring momentum for {ticker}: {e}")
        
        return scores
    
    def calculate_composite_score(self, growth: float, quality: float, 
                                  value: float, momentum: float) -> float:
        """Calculate weighted composite score"""
        composite = (
            growth * settings.WEIGHT_GROWTH +
            quality * settings.WEIGHT_QUALITY +
            value * settings.WEIGHT_VALUE +
            momentum * settings.WEIGHT_MOMENTUM
        )
        return composite
    
    def screen_stock(self, ticker: str) -> Optional[ScreeningScore]:
        """Screen and score a single stock"""
        try:
            # Get latest data
            stock = self.db.query(Stock).filter(Stock.ticker == ticker).first()
            if not stock:
                return None
            
            # Get latest fundamental data
            fundamental = (
                self.db.query(Fundamental)
                .filter(Fundamental.ticker == ticker)
                .order_by(Fundamental.date.desc())
                .first()
            )
            
            # Get latest technical data
            technical = (
                self.db.query(TechnicalIndicator)
                .filter(TechnicalIndicator.ticker == ticker)
                .order_by(TechnicalIndicator.date.desc())
                .first()
            )
            
            if not fundamental or not technical:
                logger.warning(f"Missing data for {ticker}")
                return None
            
            # Check basic filters
            passes_filters = (
                stock.market_cap >= settings.MIN_MARKET_CAP and
                stock.avg_volume >= settings.MIN_AVG_VOLUME and
                stock.current_price >= settings.MIN_PRICE
            )
            
            # Calculate factor scores
            growth_scores = self.score_growth_factors(ticker, fundamental)
            quality_scores = self.score_quality_factors(ticker, fundamental)
            value_scores = self.score_value_factors(ticker, fundamental)
            momentum_scores = self.score_momentum_factors(ticker, technical, stock)
            
            # Calculate composite score
            composite = self.calculate_composite_score(
                growth_scores['overall_growth'],
                quality_scores['overall_quality'],
                value_scores['overall_value'],
                momentum_scores['overall_momentum']
            )
            
            # Create screening score record
            today = datetime.now().date()
            record_id = f"{ticker}_{today}"
            
            screening_score = self.db.query(ScreeningScore).filter(
                ScreeningScore.id == record_id
            ).first()
            
            if not screening_score:
                screening_score = ScreeningScore(id=record_id, ticker=ticker, date=today)
                self.db.add(screening_score)
            
            # Save scores
            screening_score.growth_score = growth_scores['overall_growth']
            screening_score.quality_score = quality_scores['overall_quality']
            screening_score.value_score = value_scores['overall_value']
            screening_score.momentum_score = momentum_scores['overall_momentum']
            screening_score.composite_score = composite
            
            # Component scores
            screening_score.revenue_growth_score = growth_scores['revenue_growth']
            screening_score.eps_growth_score = growth_scores['eps_growth']
            screening_score.roe_score = quality_scores['roe']
            screening_score.debt_score = quality_scores['debt']
            screening_score.margin_score = quality_scores['margin']
            screening_score.pe_score = value_scores['pe']
            screening_score.pb_score = value_scores['pb']
            screening_score.peg_score = value_scores['peg']
            screening_score.trend_score = momentum_scores['trend']
            screening_score.rsi_score = momentum_scores['rsi']
            screening_score.volume_score = momentum_scores['volume']
            
            screening_score.passes_basic_filters = 1.0 if passes_filters else 0.0
            
            self.db.commit()
            
            return screening_score
            
        except Exception as e:
            logger.error(f"Error screening {ticker}: {e}")
            self.db.rollback()
            return None
    
    def screen_all_stocks(self):
        """Screen all stocks and calculate scores"""
        try:
            logger.info("Starting stock screening...")
            
            # Get all tickers that pass basic filters
            tickers = self.apply_basic_filters()
            
            logger.info(f"Screening {len(tickers)} stocks...")
            
            for ticker in tickers:
                self.screen_stock(ticker)
            
            # Calculate rankings
            self.calculate_rankings()
            
            logger.info("Completed stock screening")
            
        except Exception as e:
            logger.error(f"Error in screen_all_stocks: {e}")
    
    def calculate_rankings(self):
        """Calculate rank and percentile for all screened stocks"""
        try:
            today = datetime.now().date()
            
            # Get all scores for today
            scores = (
                self.db.query(ScreeningScore)
                .filter(
                    ScreeningScore.date == today,
                    ScreeningScore.passes_basic_filters == 1.0
                )
                .order_by(ScreeningScore.composite_score.desc())
                .all()
            )
            
            total = len(scores)
            
            for rank, score in enumerate(scores, 1):
                score.rank = rank
                score.percentile = ((total - rank + 1) / total) * 100
            
            self.db.commit()
            logger.info(f"Calculated rankings for {total} stocks")
            
        except Exception as e:
            logger.error(f"Error calculating rankings: {e}")
            self.db.rollback()
    
    def get_top_candidates(self, limit: int = 50, sector: Optional[str] = None) -> List[Dict]:
        """Get top N stock candidates with full analysis, optionally filtered by sector"""
        try:
            # Get the most recent date with screening scores
            latest_date = (
                self.db.query(func.max(ScreeningScore.date))
                .scalar()
            )
            
            if not latest_date:
                logger.warning("No screening scores found in database")
                return []
            
            logger.info(f"Using screening scores from {latest_date}")
            
            # Build query
            query = (
                self.db.query(ScreeningScore)
                .join(Stock, ScreeningScore.ticker == Stock.ticker)
                .filter(
                    ScreeningScore.date == latest_date,
                    ScreeningScore.passes_basic_filters == 1.0
                )
            )
            
            # Add sector filter if provided
            if sector:
                logger.info(f"Filtering by sector: {sector}")
                query = query.filter(Stock.sector == sector)
            
            top_stocks = (
                query
                .order_by(ScreeningScore.composite_score.desc())
                .limit(limit)
                .all()
            )
            
            results = []
            for score in top_stocks:
                stock = self.db.query(Stock).filter(Stock.ticker == score.ticker).first()
                
                # Get latest fundamental data
                fundamental = (
                    self.db.query(Fundamental)
                    .filter(Fundamental.ticker == score.ticker)
                    .order_by(Fundamental.date.desc())
                    .first()
                )
                
                candidate = {
                    'ticker': score.ticker,
                    'name': stock.name if stock else '',
                    'sector': stock.sector if stock else '',
                    'industry': stock.industry if stock else '',
                    'composite_score': score.composite_score,
                    'rank': score.rank,
                    'percentile': score.percentile,
                    'scores': {
                        'growth': score.growth_score,
                        'quality': score.quality_score,
                        'value': score.value_score,
                        'momentum': score.momentum_score
                    },
                    'market_cap': stock.market_cap if stock else None,
                    'current_price': stock.current_price if stock else None,
                    'avg_volume': stock.avg_volume if stock else None,
                    # Add fundamental metrics
                    'pe_ratio': fundamental.pe_ratio if fundamental else None,
                    'forward_pe': fundamental.forward_pe if fundamental else None,
                    'pb_ratio': fundamental.pb_ratio if fundamental else None,
                    'revenue_growth': fundamental.revenue_growth if fundamental else None,
                    'eps_growth': fundamental.eps_growth_3y if fundamental else None,
                    'roe': fundamental.roe if fundamental else None,
                    'debt_to_equity': fundamental.debt_to_equity if fundamental else None,
                    'profit_margin': fundamental.profit_margin if fundamental else None,
                }
                
                results.append(candidate)
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting top candidates: {e}")
            return []
