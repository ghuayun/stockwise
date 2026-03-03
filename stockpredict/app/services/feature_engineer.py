import pandas as pd
import numpy as np
from typing import Dict, List
from sqlalchemy.orm import Session
from loguru import logger
from datetime import datetime
import ta

from app.models import DailyData, TechnicalIndicator
from app.core.config import get_settings

settings = get_settings()

class FeatureEngineer:
    """Service for calculating technical indicators and features"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_stock_data(self, ticker: str, days: int = 300) -> pd.DataFrame:
        """Get historical stock data as DataFrame"""
        try:
            records = (
                self.db.query(DailyData)
                .filter(DailyData.ticker == ticker)
                .order_by(DailyData.date.desc())
                .limit(days)
                .all()
            )
            
            if not records:
                return pd.DataFrame()
            
            # Convert to DataFrame
            data = []
            for record in reversed(records):
                data.append({
                    'date': record.date,
                    'open': record.open,
                    'high': record.high,
                    'low': record.low,
                    'close': record.close,
                    'volume': record.volume
                })
            
            df = pd.DataFrame(data)
            df.set_index('date', inplace=True)
            df.sort_index(inplace=True)
            
            return df
            
        except Exception as e:
            logger.error(f"Error getting stock data for {ticker}: {e}")
            return pd.DataFrame()
    
    def calculate_moving_averages(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate various moving averages"""
        try:
            df['sma_20'] = df['close'].rolling(window=20).mean()
            df['sma_50'] = df['close'].rolling(window=50).mean()
            df['sma_200'] = df['close'].rolling(window=200).mean()
            df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
            df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
            
            return df
        except Exception as e:
            logger.error(f"Error calculating moving averages: {e}")
            return df
    
    def calculate_rsi(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Relative Strength Index"""
        try:
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))
            
            return df
        except Exception as e:
            logger.error(f"Error calculating RSI: {e}")
            return df
    
    def calculate_macd(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate MACD indicators"""
        try:
            df['macd'] = df['ema_12'] - df['ema_26']
            df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
            df['macd_histogram'] = df['macd'] - df['macd_signal']
            
            return df
        except Exception as e:
            logger.error(f"Error calculating MACD: {e}")
            return df
    
    def calculate_bollinger_bands(self, df: pd.DataFrame, period: int = 20) -> pd.DataFrame:
        """Calculate Bollinger Bands"""
        try:
            df['bollinger_middle'] = df['close'].rolling(window=period).mean()
            std = df['close'].rolling(window=period).std()
            df['bollinger_upper'] = df['bollinger_middle'] + (std * 2)
            df['bollinger_lower'] = df['bollinger_middle'] - (std * 2)
            
            return df
        except Exception as e:
            logger.error(f"Error calculating Bollinger Bands: {e}")
            return df
    
    def calculate_stochastic(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Stochastic Oscillator"""
        try:
            low_min = df['low'].rolling(window=period).min()
            high_max = df['high'].rolling(window=period).max()
            
            df['stochastic_k'] = 100 * (df['close'] - low_min) / (high_max - low_min)
            df['stochastic_d'] = df['stochastic_k'].rolling(window=3).mean()
            
            return df
        except Exception as e:
            logger.error(f"Error calculating Stochastic: {e}")
            return df
    
    def calculate_atr(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Average True Range"""
        try:
            high_low = df['high'] - df['low']
            high_close = np.abs(df['high'] - df['close'].shift())
            low_close = np.abs(df['low'] - df['close'].shift())
            
            tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
            df['atr'] = tr.rolling(window=period).mean()
            
            return df
        except Exception as e:
            logger.error(f"Error calculating ATR: {e}")
            return df
    
    def calculate_obv(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate On-Balance Volume"""
        try:
            obv = [0]
            for i in range(1, len(df)):
                if df['close'].iloc[i] > df['close'].iloc[i-1]:
                    obv.append(obv[-1] + df['volume'].iloc[i])
                elif df['close'].iloc[i] < df['close'].iloc[i-1]:
                    obv.append(obv[-1] - df['volume'].iloc[i])
                else:
                    obv.append(obv[-1])
            
            df['obv'] = obv
            return df
        except Exception as e:
            logger.error(f"Error calculating OBV: {e}")
            return df
    
    def calculate_price_momentum(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate price momentum over multiple periods"""
        try:
            df['price_change_1d'] = df['close'].pct_change(1) * 100
            df['price_change_5d'] = df['close'].pct_change(5) * 100
            df['price_change_10d'] = df['close'].pct_change(10) * 100
            df['price_change_20d'] = df['close'].pct_change(20) * 100
            df['price_change_50d'] = df['close'].pct_change(50) * 100
            
            return df
        except Exception as e:
            logger.error(f"Error calculating price momentum: {e}")
            return df
    
    def calculate_adx(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Average Directional Index"""
        try:
            # Calculate +DM and -DM
            high_diff = df['high'].diff()
            low_diff = -df['low'].diff()
            
            plus_dm = high_diff.where((high_diff > low_diff) & (high_diff > 0), 0)
            minus_dm = low_diff.where((low_diff > high_diff) & (low_diff > 0), 0)
            
            # Calculate ATR if not already calculated
            if 'atr' not in df.columns:
                df = self.calculate_atr(df, period)
            
            # Calculate +DI and -DI
            plus_di = 100 * (plus_dm.rolling(window=period).mean() / df['atr'])
            minus_di = 100 * (minus_dm.rolling(window=period).mean() / df['atr'])
            
            df['plus_di'] = plus_di
            df['minus_di'] = minus_di
            
            # Calculate DX and ADX
            dx = 100 * np.abs(plus_di - minus_di) / (plus_di + minus_di)
            df['adx'] = dx.rolling(window=period).mean()
            
            return df
        except Exception as e:
            logger.error(f"Error calculating ADX: {e}")
            return df
    
    def calculate_cci(self, df: pd.DataFrame, period: int = 20) -> pd.DataFrame:
        """Calculate Commodity Channel Index"""
        try:
            tp = (df['high'] + df['low'] + df['close']) / 3
            sma_tp = tp.rolling(window=period).mean()
            mad = tp.rolling(window=period).apply(lambda x: np.abs(x - x.mean()).mean())
            
            df['cci'] = (tp - sma_tp) / (0.015 * mad)
            
            return df
        except Exception as e:
            logger.error(f"Error calculating CCI: {e}")
            return df
    
    def calculate_williams_r(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Williams %R"""
        try:
            high_max = df['high'].rolling(window=period).max()
            low_min = df['low'].rolling(window=period).min()
            
            df['williams_r'] = -100 * (high_max - df['close']) / (high_max - low_min)
            
            return df
        except Exception as e:
            logger.error(f"Error calculating Williams %R: {e}")
            return df
    
    def calculate_volume_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate volume-based indicators"""
        try:
            df['volume_sma_20'] = df['volume'].rolling(window=20).mean()
            return df
        except Exception as e:
            logger.error(f"Error calculating volume indicators: {e}")
            return df
    
    def calculate_all_indicators(self, ticker: str) -> bool:
        """Calculate all technical indicators for a stock"""
        try:
            logger.info(f"Calculating indicators for {ticker}")
            
            # Get stock data
            df = self.get_stock_data(ticker, days=300)
            
            if df.empty:
                logger.warning(f"No data available for {ticker}")
                return False
            
            # Calculate all indicators
            df = self.calculate_moving_averages(df)
            df = self.calculate_rsi(df)
            df = self.calculate_macd(df)
            df = self.calculate_bollinger_bands(df)
            df = self.calculate_stochastic(df)
            df = self.calculate_atr(df)
            df = self.calculate_obv(df)
            df = self.calculate_price_momentum(df)
            df = self.calculate_adx(df)
            df = self.calculate_cci(df)
            df = self.calculate_williams_r(df)
            df = self.calculate_volume_indicators(df)
            
            # Save to database
            self._save_indicators(ticker, df)
            
            logger.info(f"Successfully calculated indicators for {ticker}")
            return True
            
        except Exception as e:
            logger.error(f"Error calculating indicators for {ticker}: {e}")
            return False
    
    def _save_indicators(self, ticker: str, df: pd.DataFrame):
        """Save calculated indicators to database"""
        try:
            # Only save recent data (last 90 days)
            recent_df = df.tail(90)
            
            for date, row in recent_df.iterrows():
                record_id = f"{ticker}_{date}"
                
                indicator = self.db.query(TechnicalIndicator).filter(
                    TechnicalIndicator.id == record_id
                ).first()
                
                if not indicator:
                    indicator = TechnicalIndicator(id=record_id, ticker=ticker, date=date)
                    self.db.add(indicator)
                
                # Moving averages
                indicator.sma_20 = row.get('sma_20')
                indicator.sma_50 = row.get('sma_50')
                indicator.sma_200 = row.get('sma_200')
                indicator.ema_12 = row.get('ema_12')
                indicator.ema_26 = row.get('ema_26')
                
                # Momentum indicators
                indicator.rsi = row.get('rsi')
                indicator.macd = row.get('macd')
                indicator.macd_signal = row.get('macd_signal')
                indicator.macd_histogram = row.get('macd_histogram')
                indicator.stochastic_k = row.get('stochastic_k')
                indicator.stochastic_d = row.get('stochastic_d')
                
                # Volatility indicators
                indicator.bollinger_upper = row.get('bollinger_upper')
                indicator.bollinger_middle = row.get('bollinger_middle')
                indicator.bollinger_lower = row.get('bollinger_lower')
                indicator.atr = row.get('atr')
                
                # Volume indicators
                indicator.volume_sma_20 = row.get('volume_sma_20')
                indicator.obv = row.get('obv')
                
                # Price momentum
                indicator.price_change_1d = row.get('price_change_1d')
                indicator.price_change_5d = row.get('price_change_5d')
                indicator.price_change_10d = row.get('price_change_10d')
                indicator.price_change_20d = row.get('price_change_20d')
                indicator.price_change_50d = row.get('price_change_50d')
                
                # Trend indicators
                indicator.adx = row.get('adx')
                indicator.plus_di = row.get('plus_di')
                indicator.minus_di = row.get('minus_di')
                
                # Additional indicators
                indicator.cci = row.get('cci')
                indicator.williams_r = row.get('williams_r')
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error saving indicators for {ticker}: {e}")
            self.db.rollback()
    
    def calculate_all_stocks_indicators(self):
        """Calculate indicators for all stocks in database"""
        try:
            from app.models import Stock
            
            stocks = self.db.query(Stock).filter(Stock.is_active == True).all()
            
            logger.info(f"Calculating indicators for {len(stocks)} stocks")
            
            for stock in stocks:
                self.calculate_all_indicators(stock.ticker)
            
            logger.info("Completed calculating all indicators")
            
        except Exception as e:
            logger.error(f"Error in calculate_all_stocks_indicators: {e}")
