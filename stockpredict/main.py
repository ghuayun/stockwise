from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.core.config import get_settings
from app.core.database import init_db
from app.api.routes import router

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "logs/app_{time}.log",
    rotation="1 day",
    retention="30 days",
    level="DEBUG"
)

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="""
    Stock Prediction API - ML-powered stock screening and prediction system
    
    ## Features
    
    * **Multi-layer Screening**: Basic filters + Fundamental + Technical analysis
    * **Composite Scoring**: Weighted scoring across Growth, Quality, Value, and Momentum
    * **ML Predictions**: XGBoost/LightGBM models for 1w, 1m, 3m timeframes
    * **Real-time Data**: YFinance integration for NASDAQ stocks
    * **Comprehensive Analysis**: Full breakdown of scores and predictions
    
    ## Endpoints
    
    * `/api/candidates` - Get top N stock candidates with predictions
    * `/api/stock/{ticker}` - Get detailed analysis for a specific stock
    * `/api/screen` - Custom screening with filters
    * `/api/predict/{ticker}` - On-demand prediction generation
    * `/api/health` - Health check endpoint
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Starting Stock Prediction API...")
    logger.info(f"Database type: {settings.DATABASE_TYPE}")
    logger.info(f"Database URL: {settings.database_url}")
    
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Stock Prediction API...")

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=False,
        log_level="info"
    )
