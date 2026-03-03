from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Stock(Base):
    """Stock master table - stores basic stock information"""
    __tablename__ = "stocks"
    
    ticker = Column(String(10), primary_key=True, index=True)
    name = Column(String(255))
    sector = Column(String(100))
    industry = Column(String(100))
    exchange = Column(String(20), default="NASDAQ")
    market_cap = Column(Float)
    
    # Basic filters
    current_price = Column(Float)
    avg_volume = Column(Float)  # Average daily volume
    
    # Status
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    daily_data = relationship("DailyData", back_populates="stock", cascade="all, delete-orphan")
    fundamentals = relationship("Fundamental", back_populates="stock", cascade="all, delete-orphan")
    technical_indicators = relationship("TechnicalIndicator", back_populates="stock", cascade="all, delete-orphan")
    screening_scores = relationship("ScreeningScore", back_populates="stock", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="stock", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Stock(ticker={self.ticker}, name={self.name})>"
