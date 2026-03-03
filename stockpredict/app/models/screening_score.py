from sqlalchemy import Column, String, Float, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class ScreeningScore(Base):
    """Screening scores for stocks based on multi-factor analysis"""
    __tablename__ = "screening_scores"
    
    id = Column(String(50), primary_key=True)  # ticker_date format
    ticker = Column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Individual Factor Scores (0-100 scale)
    growth_score = Column(Float)  # Revenue & EPS growth
    quality_score = Column(Float)  # ROE, margins, debt
    value_score = Column(Float)  # P/E vs sector, P/B
    momentum_score = Column(Float)  # SMA crossovers, RSI
    
    # Composite Score (weighted combination)
    composite_score = Column(Float, index=True)
    
    # Individual Component Scores (granular breakdown)
    # Growth Components
    revenue_growth_score = Column(Float)
    eps_growth_score = Column(Float)
    
    # Quality Components
    roe_score = Column(Float)
    debt_score = Column(Float)
    margin_score = Column(Float)
    
    # Value Components
    pe_score = Column(Float)
    pb_score = Column(Float)
    peg_score = Column(Float)
    
    # Momentum Components
    trend_score = Column(Float)  # Price vs MA
    rsi_score = Column(Float)
    volume_score = Column(Float)
    
    # Basic Filter Pass/Fail
    passes_basic_filters = Column(Float)  # 1.0 = pass, 0.0 = fail
    
    # Ranking
    rank = Column(Float)  # Overall rank among all stocks
    percentile = Column(Float)  # Percentile ranking
    
    # Relationship
    stock = relationship("Stock", back_populates="screening_scores")
    
    # Composite index
    __table_args__ = (
        Index('idx_screening_ticker_date', 'ticker', 'date'),
        Index('idx_screening_composite_score', 'composite_score'),
    )
    
    def __repr__(self):
        return f"<ScreeningScore(ticker={self.ticker}, date={self.date}, score={self.composite_score})>"
