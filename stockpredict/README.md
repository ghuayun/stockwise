# Stock Prediction System

A comprehensive full-stack application for stock analysis, screening, and ML-powered predictions focused on NASDAQ stocks.

## 🌐 Full-Stack Architecture

- **Backend**: Python FastAPI with SQLAlchemy ORM and ML models
- **Frontend**: React + TypeScript with TanStack Query and Tailwind CSS
- **Database**: SQLite (development) / MySQL (production)
- **ML Models**: XGBoost and LightGBM for predictions

## Features

### 🖥️ Frontend Dashboard
- **Top 20 Stock Candidates**: Real-time display of AI-recommended stocks
- **Interactive Watchlist**: Add/remove stocks with localStorage persistence
- **Live Predictions**: View ML predictions with confidence scores
- **Responsive Design**: Modern UI with Tailwind CSS
- **Auto-refresh**: Updates every minute for latest data

### 🎯 Multi-Layer Stock Screening
- **Layer A - Basic Filters**: Market cap > $1B, Volume > 500K, Price > $5
- **Layer B - Fundamental Analysis**: Growth, Quality, Value metrics
- **Layer C - Technical Analysis**: Momentum, Trend, Volume indicators

### 📊 Composite Scoring System
- **Growth (30%)**: Revenue & EPS growth
- **Quality (25%)**: ROE, margins, debt ratios
- **Value (25%)**: P/E, P/B, PEG ratios
- **Momentum (20%)**: Technical indicators, price trends

### 🤖 ML Predictions
- XGBoost/LightGBM models for multi-timeframe predictions
- Predicts probability of outperforming S&P 500
- Timeframes: 1 week, 1 month, 3 months
- 80+ engineered features

### 🔄 Data Pipeline
- Batch fetching from YFinance (50 stocks at once)
- Rate limit handling with automatic retry (5-second delay)
- SQLite for local development, MySQL for production
- Daily automated updates after market close
- On-demand updates during trading hours

### 🚀 REST API
- FastAPI with automatic OpenAPI documentation
- Top N candidates with analysis
- Single stock detailed analysis
- Custom screening with filters
- On-demand predictions

## Project Structure

```
stockpredict/
├── frontend/             # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components (StockCard, StockList, Watchlist)
│   │   ├── hooks/        # Custom hooks (useWatchlist)
│   │   ├── services/     # API client (axios)
│   │   ├── types/        # TypeScript interfaces
│   │   └── App.tsx       # Main app component
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── app/
│   ├── api/              # FastAPI routes
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── core/             # Configuration & database
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── database.py
│   ├── models/           # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── stock.py
│   │   ├── daily_data.py
│   │   ├── fundamental.py
│   │   ├── technical_indicator.py
│   │   ├── screening_score.py
│   │   └── prediction.py
│   ├── services/         # Business logic
│   │   ├── __init__.py
│   │   ├── data_fetcher.py
│   │   ├── feature_engineer.py
│   │   └── screener.py
│   └── ml/               # Machine learning
│       ├── __init__.py
│       └── predictor.py
├── scripts/              # Maintenance scripts
│   ├── daily_update.py   # Daily data pipeline
│   └── train_models.py   # Model training
├── data/                 # SQLite database (local)
├── models/               # Trained ML models
├── logs/                 # Application logs
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variables template
└── README.md

```

## Installation

### Prerequisites
- Python 3.9+
- Node.js 20.17+
- npm 10+
- pip

## Quick Start (Full Stack)

### 1. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Initialize database
python -c "from app.core.database import init_db; init_db()"

# Run daily update (optional - populates data)
python scripts/daily_update.py

# Start backend server
python main.py
```

Backend will be available at **http://localhost:8000**

### 2. Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at **http://localhost:5173**

### 3. Access the Application

Open your browser to:
- **Dashboard**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **API**: http://localhost:8000

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd stockpredict
```

2. **Create virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Initialize database**
```bash
python -c "from app.core.database import init_db; init_db()"
```

## Usage

### Starting the API Server

```bash
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints

#### Get Top Candidates
```bash
GET /api/candidates?limit=50&timeframe=1m&min_score=60
```
Returns top N stocks ranked by composite score with ML predictions.

#### Get Single Stock Analysis
```bash
GET /api/stock/AAPL
```
Returns comprehensive analysis for a specific stock.

#### Custom Screening
```bash
GET /api/screen?min_market_cap=5000000000&sector=Technology&limit=100
```
Filter stocks with custom parameters.

#### On-Demand Prediction
```bash
POST /api/predict/AAPL
```
Generate fresh predictions for a specific stock.

#### Health Check
```bash
GET /api/health
```
Check API and database status.

### Daily Data Pipeline

Run the daily update script after market close:

```bash
python scripts/daily_update.py
```

This will:
1. Fetch latest data from YFinance for all NASDAQ stocks
2. Calculate technical indicators
3. Run screening and scoring
4. Generate ML predictions

### Training ML Models

Train or retrain models (recommended weekly):

```bash
python scripts/train_models.py
```

## Configuration

Edit `.env` file to customize settings:

```env
# Database Configuration
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./data/stocks.db

# MySQL (Production)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=stockpredict

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Stock Fetching Configuration
BATCH_SIZE=50
DATA_MONTHS=3

# Screening Configuration
MIN_MARKET_CAP=1000000000
MIN_AVG_VOLUME=500000
MIN_PRICE=5.0

# Scoring Weights
WEIGHT_GROWTH=0.30
WEIGHT_QUALITY=0.25
WEIGHT_VALUE=0.25
WEIGHT_MOMENTUM=0.20
```

## Screening Criteria

### Basic Filters
- Market cap > $1B
- Average daily volume > 500K shares
- Stock price > $5

### Fundamental Factors
- **Valuation**: P/E (5-40), Forward P/E < industry median, P/B < 5
- **Growth**: Revenue growth > 10% YoY, Positive EPS growth
- **Quality**: ROE > 10%, Debt/Equity < 1, Stable margins
- **Profitability**: Positive FCF, Positive operating margin

### Technical Factors
- Price above 200-day MA
- SMA(50) > SMA(200) (Golden Cross)
- RSI between 40-70
- Volume above 20-day average

## ML Model Features

The prediction models use 40+ features including:

**Fundamental Features:**
- Valuation ratios (P/E, P/B, P/S, PEG)
- Growth metrics (revenue, earnings)
- Quality metrics (ROE, ROA, debt ratios)
- Profitability metrics (margins, FCF)

**Technical Features:**
- Momentum indicators (RSI, MACD, Stochastic)
- Trend indicators (Moving averages, ADX)
- Volatility indicators (ATR, Bollinger Bands)
- Volume indicators (OBV, volume ratios)

**Derived Features:**
- Price momentum (multiple timeframes)
- Moving average crossovers
- Screening scores (growth, quality, value, momentum)

## Database Schema

### Core Tables
- **stocks**: Master table with stock information
- **daily_data**: OHLCV data
- **fundamentals**: Financial metrics
- **technical_indicators**: Calculated technical indicators
- **screening_scores**: Multi-factor scoring results
- **predictions**: ML prediction results

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black app/ scripts/
flake8 app/ scripts/
```

## Production Deployment

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

### Environment Variables
Set production environment variables for:
- Database connection (MySQL)
- API keys if needed
- Logging configuration
- Resource limits

### Scheduling
Use cron or task scheduler for:
- Daily updates: After market close (e.g., 4:30 PM EST)
- Weekly model retraining: Weekends
- Database maintenance: Weekly

Example cron job:
```bash
# Daily update at 4:30 PM EST
30 16 * * 1-5 cd /path/to/stockpredict && python scripts/daily_update.py

# Weekly model training on Sunday at 2 AM
0 2 * * 0 cd /path/to/stockpredict && python scripts/train_models.py
```

## Performance Considerations

- **Batch Processing**: Fetches 100 stocks at once from YFinance
- **Database Indexing**: Optimized queries with composite indexes
- **Caching**: Consider Redis for frequently accessed data
- **Async Processing**: Use Celery for background tasks in production

## Limitations & Disclaimers

⚠️ **Important Notes:**

1. This system is for educational/research purposes
2. Not financial advice - do your own research
3. Past performance doesn't guarantee future results
4. YFinance data may have delays or inaccuracies
5. ML predictions are probabilistic, not guarantees
6. Always verify data from official sources

## Future Enhancements

- [ ] Real-time data streaming
- [ ] More sophisticated ML models (LSTMs, Transformers)
- [ ] Sentiment analysis from news/social media
- [ ] Portfolio optimization features
- [ ] Backtesting framework
- [ ] Web frontend dashboard
- [ ] Email/SMS alerts for top picks
- [ ] Integration with brokerage APIs

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [your-email]

## Acknowledgments

- YFinance for stock data
- FastAPI for the excellent web framework
- XGBoost and LightGBM teams
- SQLAlchemy for ORM capabilities
