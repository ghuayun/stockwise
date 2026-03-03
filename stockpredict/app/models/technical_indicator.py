from sqlalchemy import Column, String, Float, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class TechnicalIndicator(Base):
    """Technical indicators for stocks"""
    __tablename__ = "technical_indicators"
    
    id = Column(String(50), primary_key=True)  # ticker_date format
    ticker = Column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Moving Averages
    sma_20 = Column(Float)  # 20-day simple moving average
    sma_50 = Column(Float)  # 50-day simple moving average
    sma_200 = Column(Float)  # 200-day simple moving average
    ema_12 = Column(Float)  # 12-day exponential moving average
    ema_26 = Column(Float)  # 26-day exponential moving average
    
    # Momentum Indicators
    rsi = Column(Float)  # Relative Strength Index (14-day)
    macd = Column(Float)  # MACD line
    macd_signal = Column(Float)  # MACD signal line
    macd_histogram = Column(Float)  # MACD histogram
    stochastic_k = Column(Float)  # Stochastic %K
    stochastic_d = Column(Float)  # Stochastic %D
    
    # Volatility Indicators
    bollinger_upper = Column(Float)  # Upper Bollinger Band
    bollinger_middle = Column(Float)  # Middle Bollinger Band
    bollinger_lower = Column(Float)  # Lower Bollinger Band
    atr = Column(Float)  # Average True Range
    
    # Volume Indicators
    volume_sma_20 = Column(Float)  # 20-day volume average
    obv = Column(Float)  # On-Balance Volume
    
    # Price Momentum
    price_change_1d = Column(Float)  # 1-day price change %
    price_change_5d = Column(Float)  # 5-day price change %
    price_change_10d = Column(Float)  # 10-day price change %
    price_change_20d = Column(Float)  # 20-day price change %
    price_change_50d = Column(Float)  # 50-day price change %
    
    # Trend Indicators
    adx = Column(Float)  # Average Directional Index
    plus_di = Column(Float)  # Plus Directional Indicator
    minus_di = Column(Float)  # Minus Directional Indicator
    
    # Additional Indicators
    cci = Column(Float)  # Commodity Channel Index
    williams_r = Column(Float)  # Williams %R
    
    # Relationship
    stock = relationship("Stock", back_populates="technical_indicators")
    
    # Composite index
    __table_args__ = (
        Index('idx_technical_ticker_date', 'ticker', 'date'),
    )
    
    def __repr__(self):
        return f"<TechnicalIndicator(ticker={self.ticker}, date={self.date}, rsi={self.rsi})>"
