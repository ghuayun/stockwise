# Stock Analysis Platform - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Modern Fintech Dashboard  
**References:** Bloomberg Terminal (simplified), Robinhood (clean data presentation), Linear (typography), Stripe (professional restraint)  
**Rationale:** Data-heavy financial application requiring clarity, trust, and efficient information hierarchy. Professional fintech aesthetic with emphasis on readability and quick data comprehension.

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 222 15% 8% (deep charcoal)
- Surface: 222 15% 12% (elevated panels)
- Border: 222 10% 18% (subtle divisions)
- Primary Brand: 217 91% 60% (confident blue - trustworthy, professional)
- Success (Gains): 142 71% 45% (market green)
- Error (Losses): 0 72% 51% (alert red)
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 65%

**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Border: 220 13% 91%
- Primary Brand: 217 91% 60%
- Text Primary: 222 15% 12%
- Text Secondary: 222 10% 40%

**Data Visualization Accents:**
- Chart Line: 217 91% 60% (primary blue)
- Volume Bars: 222 10% 30% (muted gray)
- Positive Trend: 142 71% 45%
- Negative Trend: 0 72% 51%
- Neutral/Warning: 43 96% 56% (amber for alerts)

### B. Typography

**Font Stack:**
- Primary: 'Inter', system-ui, sans-serif (clean, excellent for data)
- Monospace: 'JetBrains Mono', 'Fira Code', monospace (for stock tickers, prices, percentages)

**Scale:**
- Hero/Dashboard Title: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-semibold (18px)
- Body Text: text-base (16px)
- Data Labels: text-sm font-medium (14px)
- Stock Tickers/Codes: text-sm font-mono uppercase tracking-wider
- Prices/Numbers: text-xl font-mono tabular-nums (20px, monospaced numbers)
- Metadata/Timestamps: text-xs text-secondary (12px)

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16  
- Tight spacing: gap-2, p-4 (within cards, between related elements)
- Standard spacing: gap-6, p-6 (card padding, section gaps)
- Generous spacing: gap-8, py-12 (between major sections)

**Grid Structure:**
- Dashboard: 12-column grid (grid-cols-12)
- Main content: col-span-12 lg:col-span-8 (66% on desktop)
- Sidebar: col-span-12 lg:col-span-4 (33% on desktop)
- Stock cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Historical view: Single column timeline

**Container Max-widths:**
- Full dashboard: max-w-[1600px] mx-auto
- Content sections: max-w-7xl
- Modal dialogs: max-w-2xl

### D. Component Library

**Navigation:**
- Top navigation bar: Fixed, h-16, with logo, search, user profile
- Sidebar navigation: w-64, collapsible on mobile, grouped menu items with icons

**Data Display Cards:**
- Stock recommendation card: Elevated surface with border, p-6, rounded-lg
  - Header: Ticker (mono, large) + company name
  - Key metrics row: P/E, Volume, Inst. Holdings in grid-cols-3
  - Confidence score: Progress bar with percentage
  - Sentiment badge: Pill-shaped, color-coded (green/red/gray)
  - CTA: "View Details" link

**Charts & Visualizations:**
- Price charts: Line graph, gradient fill beneath, grid lines at 10% opacity
- Volume bars: Stacked at bottom, 30% height of chart
- Sentiment timeline: Horizontal bar with gradient from negative to positive

**Tables:**
- Historical recommendations table: Striped rows (odd rows slightly elevated), sticky header
- Sortable columns with arrow indicators
- Mobile: Stack into cards with key data visible

**Status Indicators:**
- Buy signal: Solid green circle with "BUY" text
- Hold signal: Amber circle with "HOLD" text  
- Sell signal: Red circle with "SELL" text
- Loading states: Skeleton screens with shimmer effect

**Modals & Overlays:**
- Stock detail modal: Full-height slide-in from right (lg:max-w-3xl)
- Contains: Extended charts, full news list, detailed metrics, AI reasoning
- Backdrop: bg-black/50 backdrop-blur-sm

**Forms (for filters/settings):**
- Input fields: Dark background, subtle border, focus:ring-2 ring-primary
- Dropdowns: Custom styled with Headless UI, smooth transitions
- Date pickers: Calendar interface for historical data selection

### E. Animations

**Subtle Micro-interactions (Use Sparingly):**
- Card hover: scale-[1.02] transition-transform duration-200
- Data updates: Fade-in new values (animate-in fade-in duration-300)
- Chart rendering: Stagger line drawing (CSS animation, 0.8s ease-out)
- Page transitions: Slide up fade-in (translate-y-4 opacity-0 → translate-y-0 opacity-100)

**No animations for:**
- Stock price updates (instant for data integrity)
- Table sorting
- Text content changes

---

## Page-Specific Layouts

### Main Dashboard
- Top: Welcome header with date/time, total portfolio value (if applicable)
- Hero section: 3-4 key market indicators in grid (S&P 500, market sentiment, volatility)
- Featured: "Today's Top 10 Recommendations" - card grid
- Secondary: "Recent Analysis Activity" - compact list

### Stock Detail View (Modal)
- Header: Ticker, company name, current price (large, real-time)
- Tab navigation: Overview | News & Sentiment | Technical Analysis | AI Insights
- Content area: Charts, scrollable news feed, metrics tables
- Footer: "Add to Watchlist" + "View Historical Performance" CTAs

### Historical Recommendations
- Timeline view: Vertical line with dated nodes
- Each node expands to show top 10 stocks from that date
- Performance indicators: % gain/loss since recommendation
- Filter controls: Date range picker, stock search

---

## Key UX Patterns

**Data Hierarchy:**
1. Most critical: Stock ticker, current price, buy/sell signal (largest, bold)
2. Important: Confidence score, sentiment, key ratios
3. Supporting: Company name, timestamp, detailed metrics
4. Context: AI reasoning, full news articles (accessible via interaction)

**Information Density:**
- Cards show 4-6 key metrics without scrolling
- "View More" reveals extended data
- Use progressive disclosure - never overwhelm with all data at once

**Trust Indicators:**
- Show data source timestamps clearly
- Display confidence scores prominently
- Use consistent color coding for sentiment (never mix positive=red)
- Include "Last Updated" timestamps on all dynamic data

**Accessibility:**
- Maintain 4.5:1 contrast ratios for all text
- Use semantic HTML for screen readers
- Keyboard navigation for all interactive elements
- Color is never the only indicator (use icons + text labels)

---

## Technical Notes

**Icons:** Heroicons (outline style for navigation, solid for data indicators)  
**Fonts:** Via Google Fonts CDN  
**No Custom Assets:** Use placeholder comments for custom charts/graphics  
**Responsive Breakpoints:** sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)