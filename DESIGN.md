# StockWiseInvest — System Design Document

> **Generated**: March 2, 2026  
> **Purpose**: Complete architectural reference covering the ML Backend, App Backend, and Frontend. Reflects the actual codebase state, identifies documentation gaps, and provides a blueprint for restructuring.

---

## Table of Contents

1. [Documentation Audit](#1-documentation-audit)
2. [System Overview](#2-system-overview)
3. [Architecture Diagram](#3-architecture-diagram)
4. [ML Backend (Python / FastAPI)](#4-ml-backend-python--fastapi)
5. [App Backend (Node.js / Express)](#5-app-backend-nodejs--express)
6. [Frontend (React / Vite)](#6-frontend-react--vite)
7. [Data Flow](#7-data-flow)
8. [Database Design](#8-database-design)
9. [API Contracts](#9-api-contracts)
10. [External Dependencies](#10-external-dependencies)
11. [Environment Variables](#11-environment-variables)
12. [Technical Debt & Issues](#12-technical-debt--issues)
13. [Restructuring Recommendations](#13-restructuring-recommendations)

---

## 1. Documentation Audit

A full review of every documentation file against the actual codebase revealed the following gaps and inaccuracies.

### README.md (root)

| Issue | Details |
|-------|---------|
| **ML backend not mentioned** | The entire Python FastAPI ML backend (`stockpredict/`) is absent from the README. It describes the system as a single Node.js app. |
| **API endpoints incomplete** | Lists 5 endpoints but 14 exist. Missing: `/api/market-data`, `/api/recommendations/historical`, `/api/recommendations/:category`, `/api/analyses`, `/api/watchlist` (GET/POST/DELETE), `/api/refresh-logs`, `/api/ipos/:ticker`, `/api/ipos/refresh`. |
| **Signal thresholds oversimplified** | Says BUY ≥ 70, SELL < 40. Actual code requires LLM agreement: BUY needs score ≥ 70 AND LLM says BUY; SELL needs score ≤ 45 AND LLM says SELL. The LLM agreement requirement is undocumented. |
| **Database schema incomplete** | Lists 4 tables but 6 exist. Missing: `watchlist`, `historical_recommendations`. |
| **FinBERT article count wrong** | Says "5 recent articles per stock" — no such hardcoded limit in code; Finnhub returns whatever is available for the last 7 days. |
| **Environment variables incomplete** | Missing: `PORT`, `USE_DYNAMIC_DISCOVERY`, and all ML backend env vars. |
| **Curated stock list outdated** | The fallback stock lists in `stockDiscovery.ts` differ from those shown in the README. |
| **Access URL misleading** | Says `http://localhost:5173` but the Express server serves the app on port 5000 (Vite runs in middleware mode). |
| **Scoring explanation inaccurate** | Says "ML Score (60%): Rule-based heuristics" but the actual primary path uses the Python ML backend's composite score; heuristics are only a fallback. |

### design_guidelines.md

| Issue | Details |
|-------|---------|
| **shadcn/ui not mentioned** | 48 UI primitive components from shadcn/ui are used; the doc doesn't reference this. |
| **Sidebar navigation described but not built** | Doc describes a `w-64, collapsible` sidebar. The app only has a fixed top navigation bar. |
| **Portfolio value not implemented** | Doc describes "total portfolio value" in the hero section. This feature does not exist. |
| **Historical view mismatch** | Doc describes "vertical line with dated nodes." Actual implementation uses shadcn Accordion cards. |
| **Icon library mismatch** | Doc says "Heroicons" but code uses Lucide React. |

### docs/recommendation-counts.md

| Issue | Details |
|-------|---------|
| **Superseded by sector feature** | Describes 5 per cap × 3 caps = 15 total. The sector-based system now targets 5 sectors × 3 caps × 5 per sector = 75. This doc is outdated. |

### docs/sector-based-recommendations.md

| Issue | Details |
|-------|---------|
| **Accurate** | Correctly documents the current sector-based refresh logic, fallback behavior, and known limitations. |

### docs/sector-feature.md

| Issue | Details |
|-------|---------|
| **Accurate** | Implementation details match the code. Future enhancements listed remain unbuilt. |

### docs/ML-backend-dev.md

| Issue | Details |
|-------|---------|
| **Operational only** | Only covers start/stop/health scripts. Completely missing: architecture, API endpoints, data pipeline, ML model details, database schema, scoring algorithm. |

### stockpredict/README.md

| Issue | Details |
|-------|---------|
| **Ghost frontend** | Describes a `frontend/` directory with React app that does not exist inside `stockpredict/`. The frontend is at `client/` in the project root. |
| **Market cap thresholds inconsistent** | ML backend: Large ≥ $10B, Mid $2B–$10B, Small $300M–$2B. Node backend: Large ≥ $200B, Mid ≥ $10B, Small < $10B. These do not match. |
| **Batch size outdated** | README says 100 but CHANGELOG records it was changed to 50. Config default is still 100 in code. |
| **LightGBM claimed but unused** | Listed as a model type, but `train_models.py` only trains XGBoost. LightGBM is imported but never called. |
| **imbalanced-learn unused** | Listed in requirements.txt but not imported anywhere. |

### stockpredict/CHANGELOG.md

| Issue | Details |
|-------|---------|
| **Minimal** | Only one entry (batch size change from October 2025). Major features are undocumented. |

### azure/README.md

| Issue | Details |
|-------|---------|
| **Empty file** | Contains no content. The Azure deployment docs are spread across `AZURE-DEPLOYMENT.md`, `azure/SUMMARY.md`, and `azure/CHECKLIST.md` instead. |

---

## 2. System Overview

StockWiseInvest is a three-tier AI-powered stock analysis platform:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        StockWiseInvest                              │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐  │
│  │  React SPA   │◄─►│  Node.js/Express  │◄─►│  Python/FastAPI    │  │
│  │  (Frontend)  │   │  (App Backend)    │   │  (ML Backend)      │  │
│  │  Port: 5000* │   │  Port: 5000       │   │  Port: 8000        │  │
│  └──────────────┘   └──────────────────┘   └────────────────────┘  │
│                                                                     │
│  * Served via Express in dev (Vite middleware) and prod (static)    │
└─────────────────────────────────────────────────────────────────────┘
```

### Purpose

- **Discover** trending NASDAQ stocks via dynamic screeners or curated lists
- **Screen** candidates through multi-factor fundamental + technical analysis
- **Predict** stock outperformance using XGBoost ML models
- **Analyze** stocks using a hybrid approach: ML scores (60%) + LLM analysis via Groq (40%)
- **Enrich** with FinBERT sentiment analysis on financial news
- **Present** recommendations via a modern fintech dashboard with watchlist, IPO tracking, and historical performance

### Key Numbers

| Metric | Value |
|--------|-------|
| Target recommendations per refresh | 75 (5 sectors × 3 caps × 5 stocks) |
| Actual typical count | 50–75 (limited by data availability) |
| ML features per stock | 40+ (fundamental, technical, derived) |
| Prediction timeframes | 3 (1 week, 1 month, 3 months) |
| Sectors tracked | 5 (Technology, Healthcare, Financial Services, Consumer Cyclical, Energy) |
| Automated refresh schedule | Daily 9 AM EST + every 6 hours (backup) |
| News sentiment model | ProsusAI/FinBERT via HuggingFace API |
| LLM model | Llama 3.3-70b via Groq API |

---

## 3. Architecture Diagram

```
                    ┌──────────────────────────────────────────┐
                    │            External APIs                  │
                    │                                          │
                    │  ┌──────────┐  ┌──────┐  ┌───────────┐  │
                    │  │ Yahoo    │  │Finn- │  │HuggingFace│  │
                    │  │ Finance  │  │hub   │  │FinBERT API│  │
                    │  └────┬─────┘  └──┬───┘  └─────┬─────┘  │
                    │       │           │            │         │
                    │  ┌────┴───────────┴────────────┴──────┐  │
                    │  │          Groq LLM API              │  │
                    │  │     (Llama 3.3-70b-versatile)      │  │
                    │  └────────────────┬───────────────────┘  │
                    └───────────────────┼──────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   ML Backend         │  │   App Backend         │  │   Frontend           │
│   (Python/FastAPI)   │  │   (Node/Express)      │  │   (React/Vite)       │
│                      │  │                       │  │                      │
│  ┌────────────────┐  │  │  ┌─────────────────┐  │  │  ┌────────────────┐  │
│  │ DataFetcher    │  │  │  │ stockAnalyzer   │  │  │  │ Dashboard      │  │
│  │ (yfinance)     │  │  │  │ (orchestrator)  │  │  │  │ (main page)    │  │
│  └───────┬────────┘  │  │  └────────┬────────┘  │  │  └────────────────┘  │
│  ┌───────▼────────┐  │  │  ┌────────▼────────┐  │  │  ┌────────────────┐  │
│  │FeatureEngineer │  │  │  │ newsService     │  │  │  │ Historical     │  │
│  │ (27 indicators)│  │  │  │ (Finnhub+Yahoo) │  │  │  │ (timeline)     │  │
│  └───────┬────────┘  │  │  └────────┬────────┘  │  │  └────────────────┘  │
│  ┌───────▼────────┐  │  │  ┌────────▼────────┐  │  │  ┌────────────────┐  │
│  │ Screener       │  │  │  │ finbertService  │  │  │  │ WatchList      │  │
│  │ (4-factor)     │  │  │  │ (sentiment)     │  │  │  │ (sidebar)      │  │
│  └───────┬────────┘  │  │  └─────────────────┘  │  │  └────────────────┘  │
│  ┌───────▼────────┐  │  │  ┌─────────────────┐  │  │  ┌────────────────┐  │
│  │StockPredictor  │  │  │  │ groqService     │  │  │  │ IPO Tracker    │  │
│  │ (XGBoost)      │  │  │  │ (LLM analysis)  │  │  │  │ (upcoming)     │  │
│  └────────────────┘  │  │  └─────────────────┘  │  │  └────────────────┘  │
│                      │  │  ┌─────────────────┐  │  │                      │
│  ┌────────────────┐  │  │  │ mlDatabaseSvc   │  │  │                      │
│  │ SQLite         │  │  │  │ (reads ML DB)   │  │  │                      │
│  │ stocks.db      │◄─┼──┼──┤                 │  │  │                      │
│  └────────────────┘  │  │  └─────────────────┘  │  │                      │
│                      │  │  ┌─────────────────┐  │  │                      │
│  ┌────────────────┐  │  │  │ SQLite          │  │  │                      │
│  │ FastAPI REST   │◄─┼──┼──┤ dev.db          │  │  │                      │
│  │ :8000/api/*    │  │  │  └─────────────────┘  │  │                      │
│  └────────────────┘  │  │                       │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## 4. ML Backend (Python / FastAPI)

### 4.1 Purpose

Standalone stock prediction system that screens ~4,000 NASDAQ stocks using multi-factor analysis and XGBoost ML models. Provides scored candidates to the Node.js backend via REST API.

### 4.2 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | 0.109 |
| Server | Uvicorn | 0.27 |
| ORM | SQLAlchemy | 2.0 |
| Database | SQLite (dev) / MySQL (prod) | — |
| ML | XGBoost | 2.0.3 |
| Data | yfinance, pandas, numpy | 0.2.36, 2.2, 1.26 |
| Technical Analysis | ta library | 0.11 |
| Config | Pydantic Settings | 2.5 |
| Logging | Loguru | 0.7.2 |
| Scheduling | schedule | 1.2.1 |

### 4.3 Directory Structure

```
stockpredict/
├── main.py                    # FastAPI app entry point
├── scheduler_service.py       # Background scheduler (daily update)
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container config
├── app/
│   ├── api/
│   │   └── routes.py          # All REST endpoints
│   ├── core/
│   │   ├── config.py          # Pydantic settings (env vars)
│   │   └── database.py        # SQLAlchemy engine/session setup
│   ├── models/                # 6 SQLAlchemy ORM models
│   │   ├── stock.py           # Master stock table
│   │   ├── daily_data.py      # OHLCV price data
│   │   ├── fundamental.py     # 22 financial metrics
│   │   ├── technical_indicator.py  # 27 technical indicators
│   │   ├── screening_score.py # 4-factor scoring results
│   │   └── prediction.py      # ML prediction results
│   ├── services/
│   │   ├── data_fetcher.py    # Yahoo Finance data ingestion
│   │   ├── feature_engineer.py # Technical indicator calculation
│   │   └── screener.py        # Multi-factor screening & scoring
│   └── ml/
│       └── predictor.py       # XGBoost prediction engine
├── scripts/
│   ├── daily_update.py        # Daily pipeline (fetch → indicators → screen → predict)
│   ├── train_models.py        # XGBoost model training
│   └── initial_setup.py       # Quick-start with 3 test stocks
├── data/
│   └── stocks.db              # SQLite database
├── models/
│   └── model_*.pkl            # Trained XGBoost models (per timeframe)
├── logs/                      # Loguru rotating log files
└── cache/                     # Ticker cache
```

### 4.4 Data Pipeline

```
Yahoo Finance (yfinance)
       │
       ▼
┌─────────────────────┐
│  1. DataFetcher     │  Batch fetch OHLCV + fundamentals
│     (50 tickers/    │  4-tier NASDAQ ticker source:
│      batch, 2s      │    NASDAQ FTP → HTTP → API → Wikipedia
│      delay)         │  Rate limit retry: 3 attempts, 5s delay
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  2. FeatureEngineer │  27 technical indicators:
│     (per stock)     │    SMA(20/50/200), EMA(12/26), RSI(14),
│                     │    MACD, Stochastic, Bollinger, ATR,
│                     │    OBV, ADX, CCI, Williams %R,
│                     │    Price changes (1d/5d/10d/20d/50d)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  3. Screener        │  Layer A: Basic filters (cap>$1B, vol>500K, price>$5)
│     (multi-factor)  │  Layer B: 4 factor scores (0-100 each):
│                     │    Growth(30%) + Quality(25%) + Value(25%) + Momentum(20%)
│                     │  Layer C: Composite score + rank + percentile
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  4. StockPredictor  │  XGBoost binary classifier
│     (3 timeframes)  │  40+ features → P(outperform) for 1w/1m/3m
│                     │  Top 3 feature importances per prediction
│                     │  Models loaded from ./models/model_*.pkl
└─────────────────────┘
```

### 4.5 Scoring Algorithm

**Factor Weights:**

| Factor | Weight | Components |
|--------|--------|-----------|
| Growth | 30% | Revenue growth YoY, EPS growth (3-year preferred) |
| Quality | 25% | ROE, debt-to-equity (inverted), operating margins |
| Value | 25% | P/E (optimal=15), P/B (optimal≤2), PEG (optimal≤1) |
| Momentum | 20% | Price vs SMA200, golden cross, RSI position, volume ratio |

**Composite Score** = Σ (factor_score × weight), range 0–100

### 4.6 ML Model

- **Algorithm**: XGBoost classifier (n_estimators=200, max_depth=6, learning_rate=0.1)
- **Target**: Binary — 1 if stock returned >5% over the timeframe period, 0 otherwise
- **Feature vector**: 40 features (13 fundamental, 10 technical raw, 5 momentum, 5 ratios, 1 volume, 5 screening scores, 2 stock characteristics)
- **Training split**: 80/20 stratified
- **Evaluation**: Accuracy, Precision, Recall, AUC-ROC
- **Output**: P(outperform), P(underperform), prediction class, confidence, top 3 feature importances
- **Retraining**: Recommended weekly via `scripts/train_models.py`

### 4.7 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info and endpoint listing |
| GET | `/health` | Simple health (timestamp + version) |
| GET | `/api/health` | Detailed health (DB status, row counts) |
| GET | `/api/candidates` | **Primary** — Top stocks by cap category with ML predictions. Params: `limit`, `timeframe`, `min_score`, `large_cap_count`, `mid_cap_count`, `small_cap_count`, `sector` |
| GET | `/api/stock/{ticker}` | Single stock: info, scores breakdown, predictions |
| GET | `/api/screen` | Custom screening with filter params |
| POST | `/api/predict/{ticker}` | On-demand fresh prediction for a ticker |
| GET | `/api/sectors` | List distinct sectors from DB |

### 4.8 Market Cap Thresholds (ML Backend)

| Category | Range |
|----------|-------|
| Large Cap | ≥ $10B |
| Mid Cap | $2B – $10B |
| Small Cap | $300M – $2B |
| Micro Cap | < $300M (excluded) |

> **⚠️ Mismatch**: The Node.js backend uses different thresholds (Large ≥ $200B, Mid ≥ $10B, Small < $10B). See [Technical Debt #5](#12-technical-debt--issues).

---

## 5. App Backend (Node.js / Express)

### 5.1 Purpose

Orchestration layer that combines ML backend data with real-time news, FinBERT sentiment, and LLM analysis to produce hybrid stock recommendations. Serves the React frontend and manages application state.

### 5.2 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Express | 4.21 |
| Runtime | Node.js | 20+ |
| Language | TypeScript | 5.6 |
| Database | better-sqlite3 + Drizzle ORM | 12.4 / 0.39 |
| Validation | Zod (via drizzle-zod) | 3.24 |
| Scheduling | node-cron | 4.2 |
| Build | Vite (frontend) + esbuild (server) | — |
| LLM SDK | groq-sdk | 0.33 |
| Scraping | cheerio | 1.1 |

### 5.3 Directory Structure

```
server/
├── index.ts                    # Express app bootstrap
├── routes.ts                   # All 14 API endpoints (567 lines)
├── storage.ts                  # Data access layer (Drizzle ORM)
├── db.ts                       # SQLite connection (hardcoded 'dev.db')
├── scheduler.ts                # Cron jobs (daily + 6-hour backup)
├── vite.ts                     # Dev/prod client serving + log utility
├── static.ts                   # Empty file (unused)
├── backfillSectors.ts          # One-time sector backfill script
├── clearIPOs.ts                # IPO data cleanup script
├── seedIPOs.ts                 # IPO seed data
├── verifySectors.ts            # Verification diagnostic script
└── services/
    ├── stockAnalyzer.ts        # Core analysis orchestrator (514 lines)
    ├── stockDiscovery.ts       # Trending stock discovery (Yahoo screeners)
    ├── newsService.ts          # Multi-source news aggregation (461 lines)
    ├── finbertService.ts       # HuggingFace FinBERT sentiment API
    ├── groqService.ts          # Groq LLM (Llama 3.3-70b) analysis
    ├── yahooFinance.ts         # Yahoo Finance data wrapper
    ├── ipoService.ts           # Finnhub IPO calendar
    └── mlDatabaseService.ts    # Direct read of ML backend's SQLite DB

shared/
└── schema.ts                   # Drizzle schema + Zod types (shared with frontend)
```

### 5.4 Analysis Pipeline (stockAnalyzer.ts)

The hybrid scoring is the core innovation of the system:

```
            ┌──────────────────────────┐
            │   Stock Ticker Input     │
            └────────────┬─────────────┘
                         │
           ┌─────────────▼──────────────┐
           │   Data Sources (priority)  │
           │  1. ML Database (stocks.db)│
           │  2. Candidate data (API)   │
           │  3. Yahoo Finance (live)   │
           └─────────────┬──────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │ ML Score │   │  News +  │   │  LLM Score   │
   │ (60%)    │   │ FinBERT  │   │  (40%)       │
   │          │   │ Sentiment│   │  Groq Llama  │
   └────┬─────┘   └────┬─────┘   └──────┬───────┘
        │               │               │
        ▼               ▼               ▼
   ┌─────────────────────────────────────────┐
   │  Hybrid Score = ML×0.6 + LLM×0.4       │
   │  + Sentiment adjustment                  │
   │                                          │
   │  Signal Logic:                           │
   │    BUY  = score ≥ 70 AND LLM says BUY   │
   │    SELL = score ≤ 45 AND LLM says SELL   │
   │    HOLD = everything else                │
   └─────────────────────────────────────────┘
```

**ML Score sources (priority order):**
1. ML backend composite score (from `stockpredict/data/stocks.db`)
2. Heuristic calculation: price momentum (±15), P/E scoring (+10/+5/-5), sentiment contribution ((score-0.5)×40), institutional holding bonus (+5 if >60%), clamped [0,100]

**Concurrency controls:**
- `ConcurrencyLimiter` — max 2 parallel Yahoo Finance calls
- `SimpleCache<T>` — LRU cache with TTL (news: 15 min, Groq: 30 min, max 100 entries)
- Batch analysis in chunks of 10 with progress callbacks

### 5.5 Scheduler (scheduler.ts)

| Schedule | Description |
|----------|-------------|
| `0 9 * * 1-5` (9 AM EST weekdays) | Full recommendation refresh |
| `0 */6 * * *` (every 6 hours) | Backup refresh — only if recommendations table is empty |

**Refresh process:**
1. Save current recommendations as historical snapshot
2. Delete all current recommendations
3. Fetch candidates from ML backend for 5 sectors × 3 market cap categories (15 API calls)
4. If ML backend unavailable → fall back to `stockDiscovery` (dynamic screener or curated list)
5. Batch-analyze all collected tickers via `stockAnalyzer`
6. Store recommendations + create refresh log entry

### 5.6 Data Access Layer (storage.ts)

Implements `IStorage` interface with `DbStorage` class over Drizzle ORM. Manages 6 tables with these operations:

| Domain | Operations |
|--------|-----------|
| StockRecommendations | getAll, getByCategory, getBySector, create, deleteAll |
| StockAnalyses | create, getByTicker (cached 30 min), getRecent |
| UpcomingIPOs | getAll, getByTicker, create, deleteAll |
| RefreshLogs | create, getRecent |
| HistoricalRecommendations | create, getByDate, saveCurrentAsHistorical |
| Watchlist | getAll, getByTicker, create, delete, updatePrices (stub) |

**Special handling:** `news` field stored as JSON text string in SQLite, manually serialized/deserialized.

### 5.7 Service Layer Details

| Service | Purpose | External Deps |
|---------|---------|---------------|
| **stockAnalyzer** | Orchestrates full analysis pipeline with hybrid ML+LLM scoring | ML DB, Yahoo Finance, FinBERT, Groq |
| **stockDiscovery** | Discovers trending stocks via Yahoo Finance screeners; curated fallback | Yahoo Finance |
| **newsService** | Multi-source news (Finnhub → Yahoo RSS → Yahoo scraping → synthetic fallback) + FinBERT sentiment | Finnhub API, HuggingFace API |
| **finbertService** | FinBERT financial sentiment via HuggingFace Inference API | HuggingFace API |
| **groqService** | LLM analysis with structured JSON output (stock signals) and free-text (IPO analysis) | Groq API |
| **yahooFinance** | Stock quotes, company profiles, market cap categorization | yahoo-finance2 npm |
| **ipoService** | Upcoming IPOs from Finnhub calendar (next 30 days) with heuristic sector/interest | Finnhub API |
| **mlDatabaseService** | Direct read-only access to Python ML backend's SQLite DB | better-sqlite3 → stocks.db |

---

## 6. Frontend (React / Vite)

### 6.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18, TypeScript |
| Build | Vite |
| Routing | Wouter (lightweight) |
| Server State | TanStack React Query |
| Styling | Tailwind CSS + shadcn/ui (48 primitives) |
| Icons | Lucide React |
| Fonts | Inter (sans), JetBrains Mono (mono) via Google Fonts |
| Theme | Dark/Light with CSS custom properties + `.dark` class toggle |

### 6.2 Directory Structure

```
client/
├── index.html                  # Shell HTML with font loading
└── src/
    ├── main.tsx                # React root mount
    ├── App.tsx                 # Provider stack + router + navigation
    ├── index.css               # Tailwind + CSS variables + elevate system
    ├── pages/
    │   ├── Dashboard.tsx       # Main page (529 lines) — recommendations grid
    │   ├── Historical.tsx      # Historical recommendations timeline
    │   └── not-found.tsx       # 404 page
    ├── components/
    │   ├── StockListItem.tsx   # Row-style stock display (primary)
    │   ├── StockCard.tsx       # Card-style stock display (unused currently)
    │   ├── StockDetailModal.tsx # 3-tab stock analysis dialog
    │   ├── StockAnalysisSearch.tsx # Ticker input for custom analysis
    │   ├── WatchList.tsx       # Sidebar watchlist with live prices
    │   ├── UpcomingIPOCard.tsx  # IPO listing card
    │   ├── IPODetailModal.tsx  # 3-tab IPO detail dialog
    │   ├── HistoricalTimeline.tsx # Accordion-based timeline
    │   ├── MarketIndicator.tsx # Market index mini-card
    │   ├── ThemeProvider.tsx   # Dark/light theme context + localStorage
    │   ├── ThemeToggle.tsx     # Sun/Moon toggle button
    │   └── ui/                 # 48 shadcn/ui primitives
    ├── hooks/
    │   ├── use-toast.ts        # Global toast state (reducer pattern)
    │   └── use-mobile.tsx      # Mobile breakpoint detection (768px)
    └── lib/
        ├── queryClient.ts      # TanStack Query config + fetch helpers
        └── utils.ts            # cn() utility (clsx + twMerge)
```

### 6.3 Page Architecture

#### Dashboard (main page)

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Top Bar: Sector Filter | Last Updated | Refresh Button    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Market Indicators: S&P 500 | DOW | NASDAQ | QQQ | Sent.   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  StockAnalysisSearch: [Enter ticker...]  [Analyze]          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌────────────────────────────────────┐ ┌──────────────────────┐ │
│ │  Main Content (8/12 cols)          │ │  Sidebar (4/12 cols) │ │
│ │                                    │ │                      │ │
│ │  Large Cap (>$200B)                │ │  ┌────────────────┐  │ │
│ │  ├─ Technology (N)                 │ │  │  WatchList     │  │ │
│ │  │   └─ StockListItem × N         │ │  │  (live prices)  │  │ │
│ │  ├─ Healthcare (N)                 │ │  └────────────────┘  │ │
│ │  └─ ...                            │ │                      │ │
│ │                                    │ │  ┌────────────────┐  │ │
│ │  Mid Cap ($10B-$200B)              │ │  │  Upcoming IPOs │  │ │
│ │  ├─ Technology (N)                 │ │  │  (paginated)   │  │ │
│ │  └─ ...                            │ │  └────────────────┘  │ │
│ │                                    │ │                      │ │
│ │  Small Cap (<$10B)                 │ │                      │ │
│ │  ├─ Technology (N)                 │ │                      │ │
│ │  └─ ...                            │ │                      │ │
│ └────────────────────────────────────┘ └──────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────┐  ┌───────────────────────┐  │
│ │  StockDetailModal (overlay)     │  │  IPODetailModal       │  │
│ │  Tabs: Overview | News | Tech   │  │  Tabs: Overview |     │  │
│ │                                 │  │  News | AI Analysis   │  │
│ └─────────────────────────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Historical Page

- Single column, max-w-4xl centered
- Query: `GET /api/recommendations/historical`
- Component: `HistoricalTimeline` — Accordion cards per snapshot date
- Each card shows stocks with recommended vs current price and % change

### 6.4 State Management

| State Type | Mechanism |
|-----------|-----------|
| Server state | TanStack React Query (no auto-refetch, staleTime=Infinity, no retry) |
| Theme | React Context + localStorage |
| Toast notifications | In-memory reducer + listener pattern |
| Component state | useState hooks (selected modals, filters, pagination) |
| Watchlist detection | Query `/api/watchlist` inside `StockListItem` |

### 6.5 API Calls from Frontend

| Method | Endpoint | Trigger | Refetch |
|--------|----------|---------|---------|
| GET | `/api/recommendations?sector=X` | Page load + filter change | On refresh |
| GET | `/api/market-data` | Page load | Every 60s |
| GET | `/api/ipos` | Page load | On IPO refresh |
| GET | `/api/ipos/:ticker` | Click "Learn More" | — |
| GET | `/api/watchlist` | Page load + mutations | Every 60s |
| GET | `/api/recommendations/historical` | Historical page load | — |
| POST | `/api/refresh` | Click Refresh button | Invalidates recommendations |
| POST | `/api/analyze` | Submit ticker | Returns analysis for modal |
| POST | `/api/ipos/refresh` | Click IPO Refresh button | Invalidates IPOs |
| POST | `/api/watchlist` | Click star icon | Invalidates watchlist |
| DELETE | `/api/watchlist/:ticker` | Click X in watchlist | Invalidates watchlist |

### 6.6 Design System

**Color tokens** (CSS custom properties, HSL):
- Dark: Deep charcoal background (222 15% 8%), elevated panels, confident blue primary (217 91% 60%)
- Light: Clean white/gray background, same blue primary
- Semantic: Green for gains (142 71% 45%), Red for losses (0 72% 51%), Amber for warnings

**Custom CSS system:**
- `hover-elevate`, `active-elevate-2`, `toggle-elevate` — pseudo-element overlays for interactive states
- CSS shadow scale from `--shadow-2xs` to `--shadow-2xl`
- 5 chart colors for data visualization

---

## 7. Data Flow

### 7.1 Recommendation Refresh (Primary Flow)

```
                    ┌──────────┐
                    │  Trigger │  (Cron 9AM EST / Manual POST /api/refresh)
                    └────┬─────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Save current recs as  │
            │  historical snapshot   │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  For each of 5 sectors │──────────────────────┐
            │  × 3 market cap cats   │                      │
            └────────────┬───────────┘                      │
                         │                                  │
                    ┌────▼────┐                         ┌───▼───┐
                    │ ML API  │                         │Fallback│
                    │ :8000   │ ──(on failure)──────►   │Dynamic │
                    │candidates│                        │Discover│
                    └────┬────┘                         └───┬───┘
                         │                                  │
                         ├──────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Collect all tickers   │  (target: 75 unique)
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Batch analyze         │  (chunks of 10, concurrency=2)
            │  For each ticker:      │
            │    1. Get stock data   │  (ML DB → Yahoo Finance)
            │    2. Fetch news       │  (Finnhub → Yahoo → synthetic)
            │    3. FinBERT sentiment│  (HuggingFace API)
            │    4. Groq LLM analysis│  (Llama 3.3-70b)
            │    5. Hybrid scoring   │  (ML×0.6 + LLM×0.4)
            │    6. Signal generation│  (BUY/HOLD/SELL)
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Store recommendations │  (dev.db)
            │  + Refresh log entry   │
            └────────────────────────┘
```

### 7.2 Custom Stock Analysis (On-Demand)

```
User enters ticker → POST /api/analyze
       │
       ▼
┌──────────────┐        ┌──────────────┐
│ Yahoo Finance│         │  Cached?     │
│ Stock Data   │         │  (30 min)    │──► Return cached
└──────┬───────┘         └──────────────┘
       │
       ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    News      │  │   FinBERT    │  │   Groq LLM   │
│  (7 days)    │  │  Sentiment   │  │  Analysis     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └─────────────────┼─────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │ StockAnalysis    │
              │ (saved to DB)    │
              │ → Displayed in   │
              │   detail modal   │
              └──────────────────┘
```

### 7.3 ML Backend Daily Pipeline

```
Scheduler (5:00 PM EST or manual)
       │
       ▼
┌──────────────────────┐
│ 1. Fetch all NASDAQ  │  ~4,000 stocks × 50/batch = ~80 batches
│    stock data        │  (OHLCV + fundamentals from Yahoo Finance)
│    ~30-35 minutes    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 2. Calculate         │  27 technical indicators per stock
│    indicators        │  (90 days history)
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 3. Screen & score    │  Multi-factor: Growth/Quality/Value/Momentum
│    all stocks        │  Composite score → rank → percentile
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ 4. ML predictions    │  XGBoost × 3 timeframes (1w, 1m, 3m)
│    for screened      │  P(outperform) with feature importances
│    stocks            │
└──────────────────────┘
```

---

## 8. Database Design

### 8.1 App Database (dev.db — Drizzle ORM)

```
┌─────────────────────────────┐
│   stock_recommendations     │  Daily refreshed recommendations
├─────────────────────────────┤
│ id          TEXT PK (UUID)  │
│ ticker      TEXT NOT NULL   │
│ companyName TEXT NOT NULL   │
│ sector      TEXT            │
│ currentPrice REAL          │
│ priceChange  REAL          │
│ priceChangePercent REAL    │
│ signal      TEXT (BUY/HOLD/SELL) │
│ sentiment   TEXT           │
│ sentimentScore REAL        │
│ confidenceScore REAL       │
│ mlScore     REAL           │
│ llmScore    REAL           │
│ peRatio     REAL           │
│ volume      REAL           │
│ institutionalHolding REAL  │
│ marketCapCategory TEXT     │
│ createdAt   INTEGER (ts)   │
└─────────────────────────────┘

┌─────────────────────────────┐
│   stock_analyses            │  Custom on-demand analyses (cached 30 min)
├─────────────────────────────┤
│ id          TEXT PK (UUID)  │
│ ticker      TEXT NOT NULL   │
│ companyName TEXT NOT NULL   │
│ sector      TEXT            │
│ currentPrice REAL          │
│ signal      TEXT           │
│ confidenceScore REAL       │
│ sentiment   TEXT           │
│ aiInsights  TEXT           │
│ technicalAnalysis TEXT     │
│ businessSummary TEXT       │
│ news        TEXT (JSON)    │
│ createdAt   INTEGER (ts)   │
└─────────────────────────────┘

┌─────────────────────────────┐
│   upcoming_ipos             │  IPO calendar data
├─────────────────────────────┤
│ id          TEXT PK (UUID)  │
│ companyName TEXT NOT NULL   │
│ ticker      TEXT           │
│ ipoDate     TEXT           │
│ priceRange  TEXT           │
│ expectedValuation TEXT     │
│ sector      TEXT           │
│ description TEXT           │
│ exchange    TEXT           │
│ interest    TEXT           │
│ createdAt   INTEGER (ts)   │
└─────────────────────────────┘

┌─────────────────────────────┐
│   refresh_logs              │  Audit trail
├─────────────────────────────┤
│ id          TEXT PK (UUID)  │
│ refreshType TEXT            │
│ status      TEXT            │
│ stockCount  INTEGER         │
│ message     TEXT            │
│ createdAt   INTEGER (ts)   │
└─────────────────────────────┘

┌─────────────────────────────┐
│   historical_recommendations│  Snapshots before each refresh
├─────────────────────────────┤
│ id          TEXT PK (UUID)  │
│ ticker      TEXT NOT NULL   │
│ companyName TEXT            │
│ recommendedPrice REAL      │
│ currentPrice REAL          │
│ signal      TEXT           │
│ confidenceScore REAL       │
│ sentiment   TEXT           │
│ marketCapCategory TEXT     │
│ sector      TEXT           │
│ snapshotDate TEXT          │
│ createdAt   INTEGER (ts)   │
└─────────────────────────────┘

┌─────────────────────────────┐
│   watchlist                 │  User's tracked stocks
├─────────────────────────────┤
│ id          TEXT PK (UUID)  │
│ ticker      TEXT NOT NULL   │
│ companyName TEXT            │
│ sector      TEXT            │
│ addedPrice  REAL           │
│ currentPrice REAL          │
│ createdAt   INTEGER (ts)   │
└─────────────────────────────┘
```

### 8.2 ML Database (stockpredict/data/stocks.db — SQLAlchemy)

```
┌─────────────────────────────┐
│   stocks                    │  Master stock table (~4,000 NASDAQ)
├─────────────────────────────┤
│ ticker      TEXT PK         │
│ name        TEXT            │
│ sector      TEXT            │
│ industry    TEXT            │
│ market_cap  REAL           │
│ current_price REAL         │
│ avg_volume  REAL           │
│ is_active   BOOLEAN        │
│ last_updated DATETIME      │
└─────────────────────────────┘

┌─────────────────────────────┐
│   daily_data                │  OHLCV price history
├─────────────────────────────┤
│ id          PK (ticker+date)│
│ ticker, date               │
│ open, high, low, close     │
│ adj_close, volume          │
└─────────────────────────────┘

┌─────────────────────────────┐
│   fundamentals              │  22 financial metrics
├─────────────────────────────┤
│ id          PK (ticker+date)│
│ pe_ratio, forward_pe       │
│ pb_ratio, ps_ratio, peg    │
│ revenue_growth, earnings_growth │
│ revenue_growth_3y, earnings_growth_3y │
│ roe, roa                   │
│ debt_to_equity             │
│ operating_margin, profit_margin │
│ gross_margin, fcf_yield    │
│ dividend_yield, payout_ratio │
│ inst_ownership, insider_ownership │
│ short_ratio                │
└─────────────────────────────┘

┌─────────────────────────────┐
│   technical_indicators      │  27 calculated indicators
├─────────────────────────────┤
│ id          PK (ticker+date)│
│ sma_20, sma_50, sma_200   │
│ ema_12, ema_26             │
│ rsi, macd_line/signal/hist │
│ stochastic_k/d             │
│ bb_upper/middle/lower      │
│ atr, obv, volume_sma_20   │
│ price_change_1/5/10/20/50d │
│ adx, plus_di, minus_di    │
│ cci, williams_r            │
└─────────────────────────────┘

┌─────────────────────────────┐
│   screening_scores          │  Multi-factor scoring results
├─────────────────────────────┤
│ id          PK (ticker+date)│
│ growth_score, quality_score│
│ value_score, momentum_score│
│ composite_score            │
│ 11 individual component scores │
│ passes_basic_filters BOOL  │
│ rank, percentile           │
└─────────────────────────────┘

┌─────────────────────────────┐
│   predictions               │  ML prediction results
├─────────────────────────────┤
│ id          PK (ticker+date+tf) │
│ ticker, date, timeframe    │
│ prob_outperform REAL       │
│ prob_underperform REAL     │
│ confidence REAL            │
│ prediction_class TEXT      │
│ feature_importance_1/2/3   │
│ model_type, model_version  │
│ actual_return REAL (backtest) │
└─────────────────────────────┘
```

### 8.3 Cross-Database Bridge

The Node.js `mlDatabaseService.ts` opens `stockpredict/data/stocks.db` in **read-only** mode via `better-sqlite3` directly (bypassing SQLAlchemy) to query:
- `stocks` → ticker, name, sector, market_cap, current_price
- `fundamentals` → pe_ratio, pb_ratio (latest by date)
- `daily_data` → close prices for momentum calculation
- `screening_scores` → composite_score (latest by date)

This avoids Yahoo Finance API rate limits for data already available from the ML pipeline.

---

## 9. API Contracts

### 9.1 App Backend API (Express, port 5000)

| Method | Endpoint | Request | Response | Notes |
|--------|----------|---------|----------|-------|
| GET | `/api/market-data` | — | `{quotes: [{symbol, price, change, changePercent, volume}]}` | S&P 500, DOW, NASDAQ, QQQ |
| GET | `/api/recommendations` | `?sector=string` | `StockRecommendation[]` | Optional sector filter |
| GET | `/api/recommendations/historical` | — | `HistoricalRecommendation[]` | Grouped by snapshotDate |
| GET | `/api/recommendations/:category` | `:category` = large/mid/small | `StockRecommendation[]` | Market cap filter |
| POST | `/api/analyze` | `{ticker: string}` | `StockAnalysis` | Custom analysis, cached 30 min |
| GET | `/api/analyses` | `?limit=number` | `StockAnalysis[]` | Recent custom analyses |
| GET | `/api/ipos` | — | `UpcomingIPO[]` | All upcoming IPOs |
| POST | `/api/ipos` | `InsertUpcomingIPO` | `UpcomingIPO` | Create IPO (admin) |
| GET | `/api/ipos/:ticker` | — | `{ipo, profile, news, analysis}` | Full IPO detail |
| POST | `/api/ipos/refresh` | — | `{count, ipos}` | Refresh from Finnhub |
| POST | `/api/refresh` | — | `{message, status}` | Async background refresh, returns immediately |
| GET | `/api/refresh-logs` | — | `RefreshLog[]` | Recent refresh history |
| GET | `/api/watchlist` | — | `WatchlistItem[]` | All watched stocks |
| POST | `/api/watchlist` | `{ticker, companyName, sector?, addedPrice, currentPrice}` | `WatchlistItem` | Add to watchlist |
| DELETE | `/api/watchlist/:ticker` | — | `204` | Remove from watchlist |

### 9.2 ML Backend API (FastAPI, port 8000)

| Method | Endpoint | Request | Response | Notes |
|--------|----------|---------|----------|-------|
| GET | `/` | — | API info + endpoint listing | |
| GET | `/health` | — | `{status, timestamp, version}` | Simple check |
| GET | `/api/health` | — | `{status, database, counts}` | Detailed with DB stats |
| GET | `/api/candidates` | `?limit, timeframe, min_score, large_cap_count, mid_cap_count, small_cap_count, sector` | `{large_cap, mid_cap, small_cap}` each with scored candidates | **Primary endpoint** |
| GET | `/api/stock/{ticker}` | — | `{stock, scores, predictions}` | Full single-stock detail |
| GET | `/api/screen` | `?min_market_cap, min_score, sector, limit` | Filtered stock list | Custom screening |
| POST | `/api/predict/{ticker}` | — | Fresh prediction for ticker | On-demand |
| GET | `/api/sectors` | — | `string[]` | Distinct sectors in DB |

---

## 10. External Dependencies

| Service | Purpose | Required | Rate Limits | Env Var |
|---------|---------|----------|-------------|---------|
| **Yahoo Finance** (yfinance) | Stock quotes, OHLCV, company profiles, screeners | Built-in (no key) | Aggressive; mitigated by batching + delays | — |
| **Finnhub.io** | Real-time news, IPO calendar | Recommended | 60 calls/min (free tier) | `FINNHUB_API_KEY` |
| **HuggingFace** | FinBERT sentiment analysis (Inference API) | Optional | Rate-limited without key | `HUGGINGFACE_API_KEY` |
| **Groq** | LLM analysis (Llama 3.3-70b-versatile) | **Required** | Generous free tier | `GROQ_API_KEY` |
| **Yahoo Finance** (yahoo-finance2 npm) | Node.js: quotes, profiles, screeners | Built-in (no key) | Same as yfinance | — |

---

## 11. Environment Variables

### App Backend (.env at project root)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Express server port |
| `GROQ_API_KEY` | **Yes** | — | Groq API key for LLM analysis |
| `FINNHUB_API_KEY` | Recommended | — | Finnhub API key for news + IPOs |
| `HUGGINGFACE_API_KEY` | No | — | HuggingFace token for FinBERT |
| `LARGE_CAP_COUNT` | No | `5` | Stocks per large cap sector |
| `MID_CAP_COUNT` | No | `5` | Stocks per mid cap sector |
| `SMALL_CAP_COUNT` | No | `5` | Stocks per small cap sector |
| `USE_DYNAMIC_DISCOVERY` | No | `false` | Use Yahoo screeners vs curated list |

### ML Backend (.env at stockpredict/)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_TYPE` | No | `sqlite` | `sqlite` or `mysql` |
| `SQLITE_DB_PATH` | No | `./data/stocks.db` | SQLite database path |
| `MYSQL_HOST/PORT/USER/PASSWORD/DATABASE` | If MySQL | — | MySQL connection |
| `API_HOST` | No | `0.0.0.0` | FastAPI bind address |
| `API_PORT` | No | `8000` | FastAPI port |
| `BATCH_SIZE` | No | `100` | Stocks per yfinance batch (50 recommended) |
| `DATA_MONTHS` | No | `3` | Months of historical data to fetch |
| `MIN_MARKET_CAP` | No | `1000000000` | Minimum $1B market cap filter |
| `MIN_AVG_VOLUME` | No | `500000` | Minimum daily volume filter |
| `MIN_PRICE` | No | `5.0` | Minimum stock price filter |
| `WEIGHT_GROWTH` | No | `0.30` | Growth factor weight |
| `WEIGHT_QUALITY` | No | `0.25` | Quality factor weight |
| `WEIGHT_VALUE` | No | `0.25` | Value factor weight |
| `WEIGHT_MOMENTUM` | No | `0.20` | Momentum factor weight |

---

## 12. Technical Debt & Issues

### Critical

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **No authentication** | All endpoints open | Any client can trigger refresh, create IPOs, modify watchlist |
| 2 | **Two separate SQLite databases** | `dev.db` + `stockpredict/data/stocks.db` | Data duplication, sync complexity, two different ORMs |
| 3 | **Hardcoded DB paths** | `db.ts` (dev.db), `mlDatabaseService.ts` (stocks.db) | Not configurable, breaks in different environments |
| 4 | **No job queue for background work** | `routes.ts` POST /api/refresh | Background IIFE with no status tracking, error swallowing, no retry |
| 5 | **Market cap threshold mismatch** | ML: Large≥$10B, Node: Large≥$200B | Stocks categorized differently by each system |

### High

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | **Duplicate refresh logic** | `scheduler.ts` + `routes.ts` | Same ML-backend-then-fallback code repeated; bug fixes need two edits |
| 7 | **ML training target oversimplified** | `train_models.py` | Labels as "outperform" if >5% return, doesn't compare to S&P 500 as claimed |
| 8 | **Potential forward-looking data leak** | `train_models.py` | Uses current_price + latest screening scores alongside historical data |
| 9 | **LightGBM & imbalanced-learn unused** | `requirements.txt`, `train_models.py` | Dead dependencies increase install size + confusion |
| 10 | **Watchlist price updates stub** | `storage.ts` | `updateWatchlistPrices()` is a placeholder — prices never auto-update |
| 11 | **Unused npm dependencies** | `package.json` | `express-session`, `passport`, `passport-local`, `connect-pg-simple`, `memorystore`, `@neondatabase/serverless` all installed but unused |

### Medium

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 12 | **StockCard component unused** | `StockCard.tsx` | Dashboard uses StockListItem; StockCard is dead code |
| 13 | **`server/static.ts` empty** | `static.ts` | Unused file; static serving is in `vite.ts` |
| 14 | **Duplicate health endpoints** in ML backend | `routes.py` | `/health` and `/api/health` overlap |
| 15 | **SQLite concurrency** | Both databases | Fine for dev but unsafe for multi-user production |
| 16 | **No model validation guard** | ML `predictor.py` | If .pkl models missing, predictions silently return None |
| 17 | **Ghost frontend in ML README** | `stockpredict/README.md` | Describes `frontend/` directory that doesn't exist |
| 18 | **No error boundary** in React | `App.tsx` | Unhandled component errors crash the whole app |
| 19 | **`news` field as JSON string** | `storage.ts` | Manual serialize/deserialize instead of proper JSON column or related table |

---

## 13. Restructuring Recommendations

### 13.1 Proposed Architecture

```
stockwise-invest/
├── packages/
│   ├── ml-backend/            # Python FastAPI (current stockpredict/)
│   │   ├── app/
│   │   │   ├── api/           # Routes
│   │   │   ├── core/          # Config, database
│   │   │   ├── models/        # SQLAlchemy ORM
│   │   │   ├── services/      # DataFetcher, FeatureEngineer, Screener
│   │   │   └── ml/            # Predictor, trainers
│   │   ├── scripts/           # Pipeline scripts
│   │   ├── tests/             # pytest test suite
│   │   └── pyproject.toml     # Replace requirements.txt
│   │
│   ├── api-server/            # Node.js Express (current server/)
│   │   ├── src/
│   │   │   ├── routes/        # Split routes.ts into modules
│   │   │   │   ├── recommendations.ts
│   │   │   │   ├── analysis.ts
│   │   │   │   ├── ipos.ts
│   │   │   │   ├── watchlist.ts
│   │   │   │   └── market.ts
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/     # Auth, logging, error handling
│   │   │   ├── jobs/          # Background job queue (BullMQ/Agenda)
│   │   │   ├── db/            # Database config + migrations
│   │   │   └── types/         # Shared TypeScript interfaces
│   │   ├── tests/             # vitest/jest test suite
│   │   └── package.json
│   │
│   ├── web-client/            # React frontend (current client/)
│   │   ├── src/
│   │   │   ├── features/      # Feature-based modules
│   │   │   │   ├── recommendations/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   └── api.ts
│   │   │   │   ├── analysis/
│   │   │   │   ├── ipos/
│   │   │   │   ├── watchlist/
│   │   │   │   └── historical/
│   │   │   ├── shared/        # Shared UI components, utils, providers
│   │   │   └── app/           # App shell, routing, providers
│   │   └── package.json
│   │
│   └── shared/                # Shared types, constants, validation schemas
│       ├── types/
│       ├── constants/
│       └── schemas/           # Zod schemas used by both server + client
│
├── infra/                     # Infrastructure (current azure/)
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.ml
│   │   └── docker-compose.yml
│   ├── azure/
│   └── scripts/
│
├── docs/                      # Consolidated documentation
│   ├── architecture.md
│   ├── api-reference.md
│   ├── ml-pipeline.md
│   ├── deployment.md
│   └── development.md
│
├── turbo.json                 # Turborepo config (monorepo orchestration)
└── package.json               # Root workspace
```

### 13.2 Key Changes

#### Database Consolidation
- **Single database** (PostgreSQL recommended for production): eliminate the two-SQLite-database pattern
- ML backend writes screening scores + predictions → PostgreSQL
- App backend reads them directly (no `mlDatabaseService` bridge hack)
- Use Drizzle ORM for both systems OR use SQLAlchemy for ML + Drizzle for app and share via DB views
- Alternative: Keep SQLite for dev with a shared single file, add PostgreSQL adapter for prod

#### Unified Market Cap Thresholds
- Pick one set of thresholds and share via `packages/shared/constants/`
- Recommended: Large ≥ $200B, Mid $10B–$200B, Small $300M–$10B (matches display in frontend)

#### Route Modularization
- Split the 567-line `routes.ts` into 5 route modules (recommendations, analysis, IPOs, watchlist, market)
- Extract the duplicated refresh logic into a shared `refreshService`

#### Background Job Queue
- Replace the fire-and-forget IIFE in `/api/refresh` with a proper job queue (BullMQ with Redis, or Agenda with MongoDB)
- Add job status endpoint: `GET /api/refresh/status/:jobId`
- Enable retry logic, dead-letter queues, and progress tracking

#### Authentication
- Add API key or JWT authentication for admin endpoints (`POST /api/refresh`, `POST /api/ipos`)
- Consider user accounts for personalized watchlists

#### Frontend Feature Modules
- Organize by feature (recommendations, analysis, IPOs, watchlist, historical) instead of flat component structure
- Each feature owns its components, hooks, and API layer
- Shared UI primitives (shadcn/ui) stay in `shared/`

#### ML Backend Improvements
- Actually train LightGBM or remove it from requirements
- Fix training target: compare vs S&P 500 performance, not absolute 5%
- Add proper train/test temporal split (no leakage)
- Add model performance monitoring + automated retraining triggers
- Implement Alembic migrations (already in requirements but unused)
- Replace `requirements.txt` with `pyproject.toml` for proper dependency management

#### Testing
- Add test suites for all three layers (pytest for ML, vitest for Node+React)
- ML: test pipeline stages, model predictions, API responses
- App: test route handlers, service logic, storage layer
- Frontend: component tests with React Testing Library, E2E with Playwright

#### Documentation
- Maintain a single source of truth in `docs/`
- Auto-generate API docs from OpenAPI (FastAPI already does this) and from route definitions
- Add ADR (Architecture Decision Records) for major design choices

### 13.3 Migration Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 🔴 P0 | Fix market cap threshold mismatch | 1 hour | Prevents mis-categorization |
| 🔴 P0 | Add authentication to admin endpoints | 4 hours | Security |
| 🟠 P1 | Extract duplicated refresh logic | 2 hours | Maintainability |
| 🟠 P1 | Implement watchlist price updates | 2 hours | User-facing feature gap |
| 🟠 P1 | Remove unused dependencies (both npm + pip) | 1 hour | Clean dependencies |
| 🟡 P2 | Database consolidation (single PostgreSQL) | 2 days | Architecture simplification |
| 🟡 P2 | Split routes.ts into modules | 4 hours | Readability |
| 🟡 P2 | Background job queue | 1 day | Reliability |
| 🟢 P3 | Feature-based frontend restructure | 1 day | Developer experience |
| 🟢 P3 | ML training improvements | 1 day | Prediction accuracy |
| 🟢 P3 | Full test suites | 2-3 days | Quality assurance |
| 🟢 P3 | Monorepo with Turborepo | 1 day | Build optimization |

---

*This document should serve as the single source of truth for the StockWiseInvest system architecture. Update it as the codebase evolves.*
