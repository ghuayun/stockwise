# StockWiseInvest

AI-powered stock analysis and recommendation platform using hybrid ML/LLM approach with FinBERT sentiment analysis.

## Features

- **Dynamic Stock Discovery**: Automatically discovers trending stocks from market screeners (most active, day gainers)
- **Hybrid AI Analysis**: Combines rule-based heuristics (60%) with LLM insights (40%) for balanced recommendations
- **FinBERT Sentiment**: Deep learning financial sentiment analysis on news articles (85-90% accuracy)
- **Real-time News**: Fetches latest news from Finnhub.io with sentiment scores
- **Multi-cap Coverage**: Analyzes large cap (>$200B), mid cap ($10B-$200B), and small cap (<$10B) stocks
- **Automated Refresh**: Daily refresh at market open (9 AM EST) + 6-hour backup refresh
- **Custom Analysis**: Search and analyze any stock ticker on-demand

## Tech Stack

- **Backend**: Express.js, TypeScript, SQLite (better-sqlite3), Drizzle ORM
- **Frontend**: React, Vite, TanStack Query, Radix UI, Tailwind CSS
- **AI/ML**: 
  - Groq (Llama 3.3-70b) for LLM analysis
  - HuggingFace FinBERT for sentiment analysis
  - Rule-based heuristic scoring
- **APIs**:
  - Yahoo Finance (stock quotes, market data)
  - Finnhub.io (real-time news)
  - Groq Cloud (LLM inference)
  - HuggingFace (FinBERT model)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (copy `.env.example` to `.env`):
   ```bash
   # Required
   GROQ_API_KEY=your_groq_api_key          # Get at https://console.groq.com
   FINNHUB_API_KEY=your_finnhub_key        # Get at https://finnhub.io/register
   HUGGINGFACE_API_KEY=your_hf_key         # Get at https://huggingface.co/settings/tokens

   # Optional - Stock Discovery Configuration
   USE_DYNAMIC_DISCOVERY=true              # true = discover trending stocks, false = curated list
   LARGE_CAP_COUNT=3                       # Number of large cap stocks
   MID_CAP_COUNT=3                         # Number of mid cap stocks
   SMALL_CAP_COUNT=3                       # Number of small cap stocks
   ```

3. **Initialize database**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the app**: Open `http://localhost:5173` in your browser

## Stock Discovery Modes

### Dynamic Discovery (`USE_DYNAMIC_DISCOVERY=true`)
- Fetches trending stocks from Yahoo Finance screeners
- Uses "Most Active" (high volume) and "Day Gainers" lists
- Automatically classifies by market cap
- Falls back to curated list if API fails
- **Pros**: Always fresh, market-driven recommendations
- **Cons**: May include volatile or risky stocks

### Curated List (`USE_DYNAMIC_DISCOVERY=false`)
- Uses hand-picked high-quality stocks:
  - **Large Caps**: AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, BRK.B, JPM, V
  - **Mid Caps**: PLTR, SNOW, CRWD, NET, DDOG, ZS, MDB, OKTA, TEAM, WDAY
  - **Small Caps**: IONQ, RXRX, RKLB, SPIR, ACHR, JOBY, EVTL, PATH, S, U
- **Pros**: Stable, well-researched companies
- **Cons**: Static list, may miss emerging opportunities

## Database Schema

- **stock_recommendations**: Daily refreshed recommendations with scores
- **stock_analyses**: Full analysis results with news and insights (cached 30 min)
- **upcoming_ipos**: Real IPO data for upcoming public offerings
- **refresh_logs**: Audit trail of refresh operations

## API Endpoints

- `GET /api/recommendations` - Get all stock recommendations
- `GET /api/recommendations/:category` - Get recommendations by cap size (large/mid/small)
- `POST /api/analyze` - Analyze a specific stock ticker
- `POST /api/refresh` - Manually refresh recommendations
- `GET /api/ipos` - Get upcoming IPO information

## ML Model Architecture

1. **News Sentiment** (FinBERT):
   - Pre-trained on financial text (ProsusAI/finbert)
   - Analyzes 5 recent articles per stock
   - Returns positive/neutral/negative with confidence scores

2. **Hybrid Scoring**:
   - **ML Score (60%)**: Rule-based heuristics on PE ratio, volume, institutional holding, volatility
   - **LLM Score (40%)**: Groq Llama 3.3-70b analysis of company fundamentals
   - **Final Score**: Weighted combination with sentiment adjustment

3. **Signal Generation**:
   - BUY: Score ≥ 70
   - HOLD: Score 40-69
   - SELL: Score < 40

## Development

```bash
# Database migrations
npm run db:push
npm run db:studio  # Open Drizzle Studio

# Type checking
npm run check

# Linting
npm run lint
```

## Deployment

The app uses SQLite for simplicity. For production:
1. Consider PostgreSQL for better concurrency
2. Add Redis caching for API responses
3. Set up proper error monitoring (Sentry, etc.)
4. Configure rate limiting for API endpoints
5. Use environment-specific configs

## License

MIT
