from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Prediction(Base):
    """ML predictions for stock performance"""
    __tablename__ = "predictions"
    
    id = Column(String(50), primary_key=True)  # ticker_date_timeframe format
    ticker = Column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    # Prediction timeframe (1w, 1m, 3m)
    timeframe = Column(String(10), nullable=False)
    
    # Prediction probabilities
    prob_outperform = Column(Float)  # Probability of beating S&P 500
    prob_underperform = Column(Float)  # Probability of underperforming S&P 500
    
    # Confidence metrics
    confidence = Column(Float)  # Model confidence (0-1)
    prediction_class = Column(String(20))  # "outperform" or "underperform"
    
    # Feature importance (top contributing factors)
    top_feature_1 = Column(String(50))
    top_feature_1_importance = Column(Float)
    top_feature_2 = Column(String(50))
    top_feature_2_importance = Column(Float)
    top_feature_3 = Column(String(50))
    top_feature_3_importance = Column(Float)
    
    # Model metadata
    model_version = Column(String(50))
    model_type = Column(String(50))  # "xgboost" or "lightgbm"
    
    # Actual outcome (for backtesting)
    actual_return = Column(Float)  # Actual return vs S&P 500
    prediction_correct = Column(Float)  # 1.0 if correct, 0.0 if wrong, null if unknown
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    stock = relationship("Stock", back_populates="predictions")
    
    # Composite indexes
    __table_args__ = (
        Index('idx_prediction_ticker_date', 'ticker', 'date'),
        Index('idx_prediction_timeframe', 'timeframe'),
        Index('idx_prediction_prob', 'prob_outperform'),
    )
    
    def __repr__(self):
        return f"<Prediction(ticker={self.ticker}, date={self.date}, timeframe={self.timeframe}, prob={self.prob_outperform})>"
