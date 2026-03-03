from sqlalchemy import Column, String, Float, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Fundamental(Base):
    """Fundamental data for stocks"""
    __tablename__ = "fundamentals"
    
    id = Column(String(50), primary_key=True)  # ticker_date format
    ticker = Column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Valuation Metrics
    pe_ratio = Column(Float)  # Price to Earnings
    forward_pe = Column(Float)
    pb_ratio = Column(Float)  # Price to Book
    ps_ratio = Column(Float)  # Price to Sales
    peg_ratio = Column(Float)  # PEG ratio
    
    # Growth Metrics
    revenue_growth = Column(Float)  # YoY revenue growth
    earnings_growth = Column(Float)  # YoY earnings growth
    revenue_growth_3y = Column(Float)  # 3-year average
    eps_growth_3y = Column(Float)  # 3-year EPS growth
    
    # Quality Metrics
    roe = Column(Float)  # Return on Equity
    roa = Column(Float)  # Return on Assets
    debt_to_equity = Column(Float)
    current_ratio = Column(Float)
    quick_ratio = Column(Float)
    
    # Profitability Metrics
    gross_margin = Column(Float)
    operating_margin = Column(Float)
    profit_margin = Column(Float)
    free_cash_flow = Column(Float)
    operating_cash_flow = Column(Float)
    
    # Additional metrics
    book_value = Column(Float)
    enterprise_value = Column(Float)
    shares_outstanding = Column(Float)
    
    # Relationship
    stock = relationship("Stock", back_populates="fundamentals")
    
    # Composite index
    __table_args__ = (
        Index('idx_fundamental_ticker_date', 'ticker', 'date'),
    )
    
    def __repr__(self):
        return f"<Fundamental(ticker={self.ticker}, date={self.date}, pe={self.pe_ratio})>"
