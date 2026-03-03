"""
Model Trainer - Handles training of machine learning models for stock prediction
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler
import pickle
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from loguru import logger

from app.models import Stock, DailyData, TechnicalIndicator, Prediction
from app.core.config import get_settings

settings = get_settings()

class ModelTrainer:
    """Service for training ML models for stock prediction"""
    
    def __init__(self, db: Session):
        self.db = db
        self.models = {}
        self.scalers = {}
        self.model_path = settings.MODEL_PATH
        
        # Ensure model directory exists
        os.makedirs(self.model_path, exist_ok=True)
    
    def prepare_features(self, ticker: str, days_back: int = 252) -> Optional[pd.DataFrame]:
        """Prepare features for training"""
        try:
            # Get historical data with technical indicators
            query = """
            SELECT d.*, t.*
            FROM daily_data d
            LEFT JOIN technical_indicators t ON d.id = t.daily_data_id
            WHERE d.ticker = :ticker
            ORDER BY d.date DESC
            LIMIT :days_back
            """
            
            df = pd.read_sql(query, self.db.bind, params={
                'ticker': ticker,
                'days_back': days_back
            })
            
            if df.empty:
                logger.warning(f"No data available for {ticker}")
                return None
            
            # Calculate returns and labels
            df['return_1d'] = df['close'].pct_change()
            df['return_5d'] = df['close'].pct_change(5)
            df['return_20d'] = df['close'].pct_change(20)
            
            # Create binary labels (1 if price goes up in next 5 days, 0 otherwise)
            df['target'] = (df['return_5d'].shift(-5) > 0.02).astype(int)  # 2% threshold
            
            # Select feature columns
            feature_cols = [
                'rsi_14', 'macd_line', 'macd_signal', 'bb_upper', 'bb_lower',
                'sma_20', 'ema_12', 'ema_26', 'volume_sma_20', 'atr_14',
                'return_1d', 'return_5d', 'return_20d'
            ]
            
            # Keep only rows with complete data
            df = df.dropna(subset=feature_cols + ['target'])
            
            return df[feature_cols + ['target', 'date']]
            
        except Exception as e:
            logger.error(f"Error preparing features for {ticker}: {e}")
            return None
    
    def train_model(self, ticker: str, model_type: str = 'random_forest') -> bool:
        """Train a model for a specific ticker"""
        try:
            logger.info(f"Training {model_type} model for {ticker}")
            
            # Prepare data
            df = self.prepare_features(ticker)
            if df is None or len(df) < 50:
                logger.warning(f"Insufficient data for training {ticker}")
                return False
            
            # Separate features and target
            feature_cols = [col for col in df.columns if col not in ['target', 'date']]
            X = df[feature_cols]
            y = df['target']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Initialize model
            if model_type == 'random_forest':
                model = RandomForestClassifier(
                    n_estimators=100, max_depth=10, random_state=42
                )
            elif model_type == 'gradient_boost':
                model = GradientBoostingClassifier(
                    n_estimators=100, max_depth=6, random_state=42
                )
            elif model_type == 'logistic':
                model = LogisticRegression(random_state=42, max_iter=1000)
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            train_score = model.score(X_train_scaled, y_train)
            test_score = model.score(X_test_scaled, y_test)
            
            logger.info(f"Model performance - Train: {train_score:.3f}, Test: {test_score:.3f}")
            
            # Save model and scaler
            model_file = os.path.join(self.model_path, f"{ticker}_{model_type}.pkl")
            scaler_file = os.path.join(self.model_path, f"{ticker}_{model_type}_scaler.pkl")
            
            with open(model_file, 'wb') as f:
                pickle.dump(model, f)
            
            with open(scaler_file, 'wb') as f:
                pickle.dump(scaler, f)
            
            logger.info(f"Model saved: {model_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error training model for {ticker}: {e}")
            return False
    
    def load_model(self, ticker: str, model_type: str = 'random_forest') -> Tuple[Optional[object], Optional[object]]:
        """Load a trained model and its scaler"""
        try:
            model_file = os.path.join(self.model_path, f"{ticker}_{model_type}.pkl")
            scaler_file = os.path.join(self.model_path, f"{ticker}_{model_type}_scaler.pkl")
            
            if not os.path.exists(model_file) or not os.path.exists(scaler_file):
                return None, None
            
            with open(model_file, 'rb') as f:
                model = pickle.load(f)
            
            with open(scaler_file, 'rb') as f:
                scaler = pickle.load(f)
            
            return model, scaler
            
        except Exception as e:
            logger.error(f"Error loading model for {ticker}: {e}")
            return None, None
    
    def train_all_models(self) -> Dict[str, bool]:
        """Train models for all stocks with sufficient data"""
        results = {}
        
        try:
            # Get all stocks with recent data
            stocks = self.db.query(Stock).filter(
                Stock.last_updated.isnot(None)
            ).all()
            
            logger.info(f"Training models for {len(stocks)} stocks")
            
            for stock in stocks:
                try:
                    success = self.train_model(stock.ticker)
                    results[stock.ticker] = success
                    
                    if success:
                        logger.info(f"✓ {stock.ticker} - Model trained successfully")
                    else:
                        logger.warning(f"✗ {stock.ticker} - Model training failed")
                        
                except Exception as e:
                    logger.error(f"Error training model for {stock.ticker}: {e}")
                    results[stock.ticker] = False
            
            successful = sum(results.values())
            total = len(results)
            logger.info(f"Model training completed: {successful}/{total} successful")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in train_all_models: {e}")
            return {}
    
    def get_model_info(self, ticker: str) -> Dict[str, str]:
        """Get information about a trained model"""
        model_file = os.path.join(self.model_path, f"{ticker}_random_forest.pkl")
        
        if os.path.exists(model_file):
            stat = os.stat(model_file)
            return {
                'status': 'trained',
                'last_updated': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'file_size': f"{stat.st_size} bytes"
            }
        else:
            return {
                'status': 'not_trained',
                'last_updated': None,
                'file_size': None
            }