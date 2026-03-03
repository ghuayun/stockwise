from sqlalchemy import Column, String, Float, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class DailyData(Base):
    """Daily OHLCV data for stocks"""
    __tablename__ = "daily_data"
    
    id = Column(String(50), primary_key=True)  # ticker_date format
    ticker = Column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # OHLCV data
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    
    # Adjusted prices
    adj_close = Column(Float)
    
    # Relationship
    stock = relationship("Stock", back_populates="daily_data")
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_ticker_date', 'ticker', 'date'),
    )
    
    def __repr__(self):
        return f"<DailyData(ticker={self.ticker}, date={self.date}, close={self.close})>"
