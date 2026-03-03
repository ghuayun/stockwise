import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from loguru import logger
from datetime import datetime, timedelta
import joblib
import os

from app.models import Stock, DailyData, Fundamental, TechnicalIndicator, ScreeningScore, Prediction
from app.core.config import get_settings

settings = get_settings()

class StockPredictor:
    """Service for making ML predictions on stocks"""
    
    def __init__(self, db: Session):
        self.db = db
        self.models = {}
        self.load_models()
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            for timeframe in settings.PREDICTION_TIMEFRAMES:
                model_path = os.path.join(settings.MODEL_PATH, f"model_{timeframe}.pkl")
                if os.path.exists(model_path):
                    self.models[timeframe] = joblib.load(model_path)
                    logger.info(f"Loaded model for {timeframe}")
                else:
                    logger.warning(f"Model not found for {timeframe}: {model_path}")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    def prepare_features(self, ticker: str) -> Optional[pd.DataFrame]:
        """Prepare feature vector for a stock"""
        try:
            # Get stock data
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
            
            # Get latest technical indicators
            technical = (
                self.db.query(TechnicalIndicator)
                .filter(TechnicalIndicator.ticker == ticker)
                .order_by(TechnicalIndicator.date.desc())
                .first()
            )
            
            # Get latest screening scores
            screening = (
                self.db.query(ScreeningScore)
                .filter(ScreeningScore.ticker == ticker)
                .order_by(ScreeningScore.date.desc())
                .first()
            )
            
            if not all([fundamental, technical, screening]):
                logger.warning(f"Missing data for {ticker}")
                return None
            
            # Build feature dictionary
            features = {}
            
            # Fundamental features
            features['pe_ratio'] = fundamental.pe_ratio or 0
            features['pb_ratio'] = fundamental.pb_ratio or 0
            features['ps_ratio'] = fundamental.ps_ratio or 0
            features['peg_ratio'] = fundamental.peg_ratio or 0
            features['revenue_growth'] = fundamental.revenue_growth or 0
            features['earnings_growth'] = fundamental.earnings_growth or 0
            features['roe'] = fundamental.roe or 0
            features['roa'] = fundamental.roa or 0
            features['debt_to_equity'] = fundamental.debt_to_equity or 0
            features['current_ratio'] = fundamental.current_ratio or 0
            features['gross_margin'] = fundamental.gross_margin or 0
            features['operating_margin'] = fundamental.operating_margin or 0
            features['profit_margin'] = fundamental.profit_margin or 0
            
            # Technical features
            features['rsi'] = technical.rsi or 50
            features['macd'] = technical.macd or 0
            features['macd_signal'] = technical.macd_signal or 0
            features['macd_histogram'] = technical.macd_histogram or 0
            features['stochastic_k'] = technical.stochastic_k or 50
            features['stochastic_d'] = technical.stochastic_d or 50
            features['atr'] = technical.atr or 0
            features['adx'] = technical.adx or 0
            features['cci'] = technical.cci or 0
            features['williams_r'] = technical.williams_r or -50
            
            # Price momentum features
            features['price_change_1d'] = technical.price_change_1d or 0
            features['price_change_5d'] = technical.price_change_5d or 0
            features['price_change_10d'] = technical.price_change_10d or 0
            features['price_change_20d'] = technical.price_change_20d or 0
            features['price_change_50d'] = technical.price_change_50d or 0
            
            # Moving average features
            if stock.current_price and technical.sma_20:
                features['price_to_sma20'] = stock.current_price / technical.sma_20
            else:
                features['price_to_sma20'] = 1.0
                
            if stock.current_price and technical.sma_50:
                features['price_to_sma50'] = stock.current_price / technical.sma_50
            else:
                features['price_to_sma50'] = 1.0
                
            if stock.current_price and technical.sma_200:
                features['price_to_sma200'] = stock.current_price / technical.sma_200
            else:
                features['price_to_sma200'] = 1.0
            
            if technical.sma_50 and technical.sma_200:
                features['sma50_to_sma200'] = technical.sma_50 / technical.sma_200
            else:
                features['sma50_to_sma200'] = 1.0
            
            # Bollinger band features
            if stock.current_price and technical.bollinger_upper and technical.bollinger_lower:
                bb_range = technical.bollinger_upper - technical.bollinger_lower
                if bb_range > 0:
                    features['bb_position'] = (stock.current_price - technical.bollinger_lower) / bb_range
                else:
                    features['bb_position'] = 0.5
            else:
                features['bb_position'] = 0.5
            
            # Volume features
            if stock.avg_volume and technical.volume_sma_20:
                features['volume_ratio'] = stock.avg_volume / technical.volume_sma_20
            else:
                features['volume_ratio'] = 1.0
            
            # Screening scores
            features['growth_score'] = screening.growth_score or 0
            features['quality_score'] = screening.quality_score or 0
            features['value_score'] = screening.value_score or 0
            features['momentum_score'] = screening.momentum_score or 0
            features['composite_score'] = screening.composite_score or 0
            
            # Stock characteristics
            features['market_cap'] = np.log10(stock.market_cap) if stock.market_cap else 0
            features['price_level'] = np.log10(stock.current_price) if stock.current_price else 0
            
            # Convert to DataFrame
            df = pd.DataFrame([features])
            
            return df
            
        except Exception as e:
            logger.error(f"Error preparing features for {ticker}: {e}")
            return None
    
    def predict_stock(self, ticker: str, timeframe: str) -> Optional[Dict]:
        """Make prediction for a single stock and timeframe"""
        try:
            if timeframe not in self.models:
                logger.warning(f"Model not available for {timeframe}")
                return None
            
            # Prepare features
            features = self.prepare_features(ticker)
            if features is None:
                return None
            
            # Make prediction
            model = self.models[timeframe]
            proba = model.predict_proba(features)[0]
            
            # Get feature importance
            if hasattr(model, 'feature_importances_'):
                importance = model.feature_importances_
                feature_names = features.columns.tolist()
                
                # Get top 3 features
                top_indices = np.argsort(importance)[-3:][::-1]
                top_features = [
                    (feature_names[i], importance[i]) 
                    for i in top_indices
                ]
            else:
                top_features = []
            
            # Prepare result
            result = {
                'ticker': ticker,
                'timeframe': timeframe,
                'prob_outperform': float(proba[1]) if len(proba) > 1 else 0.5,
                'prob_underperform': float(proba[0]) if len(proba) > 0 else 0.5,
                'prediction_class': 'outperform' if proba[1] > 0.5 else 'underperform',
                'confidence': float(max(proba)),
                'top_features': top_features,
                'model_type': model.__class__.__name__
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error predicting {ticker} for {timeframe}: {e}")
            return None
    
    def predict_all_timeframes(self, ticker: str) -> Dict[str, Dict]:
        """Make predictions for all timeframes"""
        predictions = {}
        
        for timeframe in settings.PREDICTION_TIMEFRAMES:
            pred = self.predict_stock(ticker, timeframe)
            if pred:
                predictions[timeframe] = pred
        
        return predictions
    
    def save_prediction(self, ticker: str, timeframe: str, prediction: Dict):
        """Save prediction to database"""
        try:
            today = datetime.now().date()
            record_id = f"{ticker}_{today}_{timeframe}"
            
            pred_record = self.db.query(Prediction).filter(
                Prediction.id == record_id
            ).first()
            
            if not pred_record:
                pred_record = Prediction(
                    id=record_id,
                    ticker=ticker,
                    date=today,
                    timeframe=timeframe
                )
                self.db.add(pred_record)
            
            # Save prediction data
            pred_record.prob_outperform = prediction['prob_outperform']
            pred_record.prob_underperform = prediction['prob_underperform']
            pred_record.confidence = prediction['confidence']
            pred_record.prediction_class = prediction['prediction_class']
            pred_record.model_type = prediction['model_type']
            pred_record.model_version = "1.0"
            
            # Save top features
            if len(prediction['top_features']) > 0:
                pred_record.top_feature_1 = prediction['top_features'][0][0]
                pred_record.top_feature_1_importance = prediction['top_features'][0][1]
            
            if len(prediction['top_features']) > 1:
                pred_record.top_feature_2 = prediction['top_features'][1][0]
                pred_record.top_feature_2_importance = prediction['top_features'][1][1]
            
            if len(prediction['top_features']) > 2:
                pred_record.top_feature_3 = prediction['top_features'][2][0]
                pred_record.top_feature_3_importance = prediction['top_features'][2][1]
            
            self.db.commit()
            logger.info(f"Saved prediction for {ticker} {timeframe}")
            
        except Exception as e:
            logger.error(f"Error saving prediction for {ticker}: {e}")
            self.db.rollback()
    
    def predict_all_stocks(self):
        """Generate predictions for all screened stocks"""
        try:
            logger.info("Starting prediction generation...")
            
            # Get stocks that passed screening
            today = datetime.now().date()
            screened_stocks = (
                self.db.query(ScreeningScore.ticker)
                .filter(
                    ScreeningScore.date == today,
                    ScreeningScore.passes_basic_filters == 1.0
                )
                .all()
            )
            
            tickers = [s.ticker for s in screened_stocks]
            logger.info(f"Generating predictions for {len(tickers)} stocks...")
            
            for ticker in tickers:
                predictions = self.predict_all_timeframes(ticker)
                
                for timeframe, pred in predictions.items():
                    self.save_prediction(ticker, timeframe, pred)
            
            logger.info("Completed prediction generation")
            
        except Exception as e:
            logger.error(f"Error in predict_all_stocks: {e}")
    
    def get_stock_predictions(self, ticker: str) -> Dict:
        """Get latest predictions for a stock"""
        try:
            today = datetime.now().date()
            
            predictions = (
                self.db.query(Prediction)
                .filter(
                    Prediction.ticker == ticker,
                    Prediction.date == today
                )
                .all()
            )
            
            result = {}
            for pred in predictions:
                result[pred.timeframe] = {
                    'prob_outperform': pred.prob_outperform,
                    'prob_underperform': pred.prob_underperform,
                    'confidence': pred.confidence,
                    'prediction_class': pred.prediction_class,
                    'top_features': [
                        {'name': pred.top_feature_1, 'importance': pred.top_feature_1_importance},
                        {'name': pred.top_feature_2, 'importance': pred.top_feature_2_importance},
                        {'name': pred.top_feature_3, 'importance': pred.top_feature_3_importance}
                    ] if pred.top_feature_1 else []
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting predictions for {ticker}: {e}")
            return {}
