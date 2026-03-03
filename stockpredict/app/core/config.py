from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Database Configuration
    DATABASE_TYPE: Literal["sqlite", "mysql"] = "sqlite"
    SQLITE_DB_PATH: str = "./data/stocks.db"
    
    # MySQL Configuration
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_DATABASE: str = "stockpredict"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_TITLE: str = "Stock Prediction API"
    API_VERSION: str = "1.0.0"
    
    # Stock Fetching Configuration
    BATCH_SIZE: int = 100
    DATA_MONTHS: int = 3
    
    # ML Model Configuration
    MODEL_PATH: str = "./models"
    RETRAIN_INTERVAL_DAYS: int = 7
    
    # Screening Configuration
    MIN_MARKET_CAP: float = 1_000_000_000  # $1B
    MIN_AVG_VOLUME: int = 500_000
    MIN_PRICE: float = 5.0
    
    # Fundamental Filter Ranges
    MIN_PE_RATIO: float = 5.0
    MAX_PE_RATIO: float = 40.0
    MAX_PB_RATIO: float = 5.0
    MIN_REVENUE_GROWTH: float = 0.10  # 10%
    MIN_ROE: float = 0.10  # 10%
    MAX_DEBT_EQUITY: float = 1.0
    
    # Technical Indicator Ranges
    MIN_RSI: float = 40.0
    MAX_RSI: float = 70.0
    
    # Scoring Weights
    WEIGHT_GROWTH: float = 0.30
    WEIGHT_QUALITY: float = 0.25
    WEIGHT_VALUE: float = 0.25
    WEIGHT_MOMENTUM: float = 0.20
    
    # Prediction Timeframes
    PREDICTION_TIMEFRAMES: list = ["1w", "1m", "3m"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def database_url(self) -> str:
        """Get database URL based on configuration"""
        if self.DATABASE_TYPE == "sqlite":
            return f"sqlite:///{self.SQLITE_DB_PATH}"
        else:
            return (
                f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
                f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
