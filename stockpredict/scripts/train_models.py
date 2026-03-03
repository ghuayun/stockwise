"""
Model training script - Train ML models for stock predictions

This script should be run periodically (e.g., weekly) to retrain models
with the latest data and improve prediction accuracy.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from loguru import logger
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
import xgboost as xgb
import lightgbm as lgb
import joblib
import os

from app.core.database import SessionLocal
from app.core.config import get_settings
from app.models import Stock, DailyData, Fundamental, TechnicalIndicator, ScreeningScore

settings = get_settings()

def prepare_training_data(db, timeframe='1m'):
    """Prepare training dataset"""
    logger.info(f"Preparing training data for {timeframe}...")
    
    # Map timeframe to days
    timeframe_days = {'1w': 7, '1m': 30, '3m': 90}
    days = timeframe_days.get(timeframe, 30)
    
    # Get S&P 500 data for comparison
    # In production, fetch actual S&P 500 data
    # For now, we'll create synthetic labels based on stock performance
    
    training_data = []
    
    # Get all stocks with complete data
    stocks = db.query(Stock).filter(Stock.is_active == True).limit(500).all()
    
    for stock in stocks:
        try:
            # Get historical data
            historical_data = (
                db.query(DailyData)
                .filter(DailyData.ticker == stock.ticker)
                .order_by(DailyData.date.desc())
                .limit(days + 100)
                .all()
            )
            
            if len(historical_data) < days + 20:
                continue
            
            # Get fundamental data
            fundamental = (
                db.query(Fundamental)
                .filter(Fundamental.ticker == stock.ticker)
                .order_by(Fundamental.date.desc())
                .first()
            )
            
            # Get technical indicators
            technical = (
                db.query(TechnicalIndicator)
                .filter(TechnicalIndicator.ticker == stock.ticker)
                .order_by(TechnicalIndicator.date.desc())
                .first()
            )
            
            # Get screening scores
            screening = (
                db.query(ScreeningScore)
                .filter(ScreeningScore.ticker == stock.ticker)
                .order_by(ScreeningScore.date.desc())
                .first()
            )
            
            if not all([fundamental, technical, screening]):
                continue
            
            # Calculate target (simplified - actual return vs average)
            # In production, compare to S&P 500 return
            recent_price = historical_data[0].close
            past_price = historical_data[min(days, len(historical_data)-1)].close
            
            if past_price and recent_price:
                stock_return = (recent_price - past_price) / past_price
                
                # Simplified target: 1 if return > 5%, 0 otherwise
                target = 1 if stock_return > 0.05 else 0
                
                # Build feature vector
                features = {
                    'pe_ratio': fundamental.pe_ratio or 0,
                    'pb_ratio': fundamental.pb_ratio or 0,
                    'ps_ratio': fundamental.ps_ratio or 0,
                    'peg_ratio': fundamental.peg_ratio or 0,
                    'revenue_growth': fundamental.revenue_growth or 0,
                    'earnings_growth': fundamental.earnings_growth or 0,
                    'roe': fundamental.roe or 0,
                    'roa': fundamental.roa or 0,
                    'debt_to_equity': fundamental.debt_to_equity or 0,
                    'current_ratio': fundamental.current_ratio or 0,
                    'gross_margin': fundamental.gross_margin or 0,
                    'operating_margin': fundamental.operating_margin or 0,
                    'profit_margin': fundamental.profit_margin or 0,
                    'rsi': technical.rsi or 50,
                    'macd': technical.macd or 0,
                    'macd_signal': technical.macd_signal or 0,
                    'macd_histogram': technical.macd_histogram or 0,
                    'stochastic_k': technical.stochastic_k or 50,
                    'stochastic_d': technical.stochastic_d or 50,
                    'atr': technical.atr or 0,
                    'adx': technical.adx or 0,
                    'cci': technical.cci or 0,
                    'williams_r': technical.williams_r or -50,
                    'price_change_1d': technical.price_change_1d or 0,
                    'price_change_5d': technical.price_change_5d or 0,
                    'price_change_10d': technical.price_change_10d or 0,
                    'price_change_20d': technical.price_change_20d or 0,
                    'price_change_50d': technical.price_change_50d or 0,
                    'price_to_sma20': stock.current_price / technical.sma_20 if technical.sma_20 else 1.0,
                    'price_to_sma50': stock.current_price / technical.sma_50 if technical.sma_50 else 1.0,
                    'price_to_sma200': stock.current_price / technical.sma_200 if technical.sma_200 else 1.0,
                    'sma50_to_sma200': technical.sma_50 / technical.sma_200 if technical.sma_50 and technical.sma_200 else 1.0,
                    'bb_position': 0.5,
                    'volume_ratio': stock.avg_volume / technical.volume_sma_20 if technical.volume_sma_20 else 1.0,
                    'growth_score': screening.growth_score or 0,
                    'quality_score': screening.quality_score or 0,
                    'value_score': screening.value_score or 0,
                    'momentum_score': screening.momentum_score or 0,
                    'composite_score': screening.composite_score or 0,
                    'market_cap': np.log10(stock.market_cap) if stock.market_cap else 0,
                    'price_level': np.log10(stock.current_price) if stock.current_price else 0,
                    'target': target
                }
                
                training_data.append(features)
                
        except Exception as e:
            logger.warning(f"Error processing {stock.ticker}: {e}")
            continue
    
    df = pd.DataFrame(training_data)
    logger.info(f"Prepared {len(df)} training samples")
    
    return df

def train_model(timeframe='1m'):
    """Train model for specific timeframe"""
    logger.info(f"Training model for {timeframe}")
    
    db = SessionLocal()
    
    try:
        # Prepare data
        df = prepare_training_data(db, timeframe)
        
        if len(df) < 100:
            logger.error(f"Insufficient data for training: {len(df)} samples")
            return False
        
        # Split features and target
        X = df.drop('target', axis=1)
        y = df['target']
        
        # Split into train and test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        logger.info(f"Training set: {len(X_train)} samples")
        logger.info(f"Test set: {len(X_test)} samples")
        logger.info(f"Positive class ratio: {y_train.mean():.2%}")
        
        # Train XGBoost model
        logger.info("Training XGBoost model...")
        xgb_model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss'
        )
        
        xgb_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = xgb_model.predict(X_test)
        y_proba = xgb_model.predict_proba(X_test)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_proba)
        
        logger.info(f"XGBoost Results:")
        logger.info(f"  Accuracy:  {accuracy:.4f}")
        logger.info(f"  Precision: {precision:.4f}")
        logger.info(f"  Recall:    {recall:.4f}")
        logger.info(f"  AUC:       {auc:.4f}")
        
        # Save model
        os.makedirs(settings.MODEL_PATH, exist_ok=True)
        model_path = os.path.join(settings.MODEL_PATH, f"model_{timeframe}.pkl")
        joblib.dump(xgb_model, model_path)
        logger.info(f"Model saved to {model_path}")
        
        # Save feature names
        feature_path = os.path.join(settings.MODEL_PATH, f"features_{timeframe}.txt")
        with open(feature_path, 'w') as f:
            for feat in X.columns:
                f.write(f"{feat}\n")
        
        return True
        
    except Exception as e:
        logger.error(f"Error training model for {timeframe}: {e}")
        return False
    finally:
        db.close()

def train_all_models():
    """Train models for all timeframes"""
    logger.info("=" * 80)
    logger.info("Starting model training")
    logger.info("=" * 80)
    
    for timeframe in settings.PREDICTION_TIMEFRAMES:
        logger.info(f"\nTraining {timeframe} model...")
        success = train_model(timeframe)
        
        if success:
            logger.info(f"✓ {timeframe} model trained successfully")
        else:
            logger.error(f"✗ Failed to train {timeframe} model")
    
    logger.info("=" * 80)
    logger.info("Model training completed")
    logger.info("=" * 80)

if __name__ == "__main__":
    train_all_models()
