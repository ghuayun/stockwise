# Sector-Based Stock Recommendations

## Overview
The system now generates stock recommendations organized by both **market cap category** and **sector**, providing comprehensive coverage across the market.

## Structure

### Target Distribution
- **5 stocks per sector** for each market cap category
- **5 sectors**: Technology, Healthcare, Financial Services, Consumer Cyclical, Energy
- **3 market cap categories**: Large Cap (>$200B), Mid Cap ($10B-$200B), Small Cap (<$10B)
- **Expected total**: 75 recommendations (5 sectors × 3 cap categories × 5 stocks)

### Actual Distribution
Due to data availability constraints in the ML backend database, actual counts may vary:
- Some sectors may have fewer than 5 stocks in certain market cap categories
- Large cap stocks are particularly limited (many sectors have 0-3 large caps)
- Technology sector typically has the most coverage
- Total recommendations typically range from 50-75 stocks

## Implementation

### ML Backend (`stockpredict/app/api/routes.py`)
- **New parameter**: `sector` (optional) - filters candidates by sector
- **Query example**: 
  ```
  GET /api/candidates?large_cap_count=5&mid_cap_count=5&small_cap_count=5&sector=Technology
  ```
- **Sector filtering**: Added to `screener.get_top_candidates()` method
- **Settings**: `min_score=0`, `limit=200` to ensure enough candidates per sector

### Node Backend (`server/routes.ts`)
- **Refresh logic**: Loops through 5 sectors, requesting 5 stocks per sector per cap category
- **API calls**: Makes 5 separate calls to ML backend (one per sector)
- **Aggregation**: Combines all sector results before analyzing and storing
- **Response**: Returns total count and breakdown by sector

### Frontend (`client/src/pages/Dashboard.tsx`)
- **Grouping**: Stocks grouped by sector within each market cap section
- **Display**: Each sector shown as a separate card with count badge
- **Visual**: Small colored bar indicator next to sector name
- **Filtering**: Sector dropdown filter still works to show only selected sector

## Example Output

### Large Cap Stocks (>$200B)
- **Technology (5)**: MU, SHOP, PLTR, NVDA, AVGO
- **Healthcare (3)**: JNJ, UNH, LLY
- **Financial Services (2)**: JPM, V
- **Consumer Cyclical (0)**: *(none available)*
- **Energy (1)**: XOM

### Mid Cap Stocks ($10B-$200B)
- **Technology (5)**: QCOM, KSPI, OKTA, ADI, SAIL
- **Healthcare (5)**: VRTX, REGN, ILMN, ALNY, BIIB
- **Financial Services (5)**: MS, GS, SCHW, BX, KKR
- **Consumer Cyclical (5)**: NKE, SBUX, LULU, HD, LOW
- **Energy (5)**: SLB, HAL, EOG, DVN, MPC

### Small Cap Stocks (<$10B)
- **Technology (5)**: ARRY, PTRN, TASK, STNE, WIX
- **Healthcare (5)**: SAGE, ARVN, ACAD, FATE, BEAM
- **Financial Services (5)**: VCTR, HOOD, SOFI, LC, UPST
- **Consumer Cyclical (5)**: PTON, BIRD, LYFT, OPEN, CVNA
- **Energy (5)**: CRGY, MTDR, CLR, SM, RRC

## Configuration

### Environment Variables
No additional configuration needed. The system uses hardcoded values:
- `stocksPerSector = 5` (in routes.ts and scheduler.ts)
- `sectors = ["Technology", "Healthcare", "Financial Services", "Consumer Cyclical", "Energy"]`

### Adjusting Sectors
To modify the sector list, update in 3 places:
1. `server/routes.ts` - `sectors` array in refresh endpoint
2. `server/scheduler.ts` - `sectors` array in refreshRecommendations function
3. `client/src/pages/Dashboard.tsx` - `groupBySector` function and Select dropdown

### Adjusting Stocks Per Sector
To change from 5 to another number, update `stocksPerSector` in:
1. `server/routes.ts` - refresh endpoint
2. `server/scheduler.ts` - refreshRecommendations function

## API Endpoints

### Get All Recommendations
```
GET /api/recommendations
Returns: All stocks grouped by market cap (now includes sector grouping in frontend)
```

### Get Recommendations by Sector
```
GET /api/recommendations?sector=Technology
Returns: Only Technology stocks across all market cap categories
```

### Refresh Recommendations
```
POST /api/refresh
Returns: { count: 58, bySector: { Technology: 15, Healthcare: 11, ... } }
```

## Database Schema
No changes to schema. The `sector` field already existed:
```typescript
sector: text("sector")  // Nullable field in stockRecommendations table
```

## Scheduler
The automated refresh (daily at 9 AM EST, backup every 6 hours) uses the same sector-based logic as the manual refresh endpoint.

## Known Limitations

1. **Data Availability**: Not all sectors have 5 stocks in all market cap categories
2. **Large Cap Scarcity**: Very few large cap stocks meet screening criteria
3. **Sector Coverage**: Some niche sectors (Utilities, Real Estate) not included in the 5 selected sectors
4. **Performance**: Refresh takes longer (5 sequential API calls to ML backend)
5. **Fallback Behavior**: If ML backend fails, falls back to old method (not sector-based)

## Future Improvements

1. **Parallel API Calls**: Make sector requests in parallel to reduce refresh time
2. **Dynamic Sector Selection**: Auto-detect which sectors have enough stocks
3. **Configurable Sectors**: Allow user to select which sectors to track
4. **Adaptive Count**: Reduce per-sector count if not enough stocks available
5. **Sector Weighting**: Prioritize sectors based on market conditions or user preferences
