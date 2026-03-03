# Recommendation Count Configuration

## Overview
The system now generates **5 recommendations per market cap category**, for a total of **15 stock recommendations**.

## Configuration

### Market Cap Categories
- **Large Cap**: Market cap >= $200B (5 stocks)
- **Mid Cap**: Market cap $10B - $200B (5 stocks)
- **Small Cap**: Market cap < $10B (5 stocks)

### Environment Variables (.env)
```properties
LARGE_CAP_COUNT=5
MID_CAP_COUNT=5
SMALL_CAP_COUNT=5
```

### Code Defaults
Both `server/routes.ts` and `server/scheduler.ts` now default to **5** if environment variables are not set:
```typescript
const config = {
  largeCaps: parseInt(process.env.LARGE_CAP_COUNT || "5"),
  midCaps: parseInt(process.env.MID_CAP_COUNT || "5"),
  smallCaps: parseInt(process.env.SMALL_CAP_COUNT || "5"),
};
```

## Changes Made

1. **routes.ts** - Manual refresh endpoint now requests 5 per category
2. **scheduler.ts** - Automated refresh tasks now request 5 per category  
3. **.env** - Default counts updated from 3 to 5

## Testing

To test the new configuration:

```bash
# Ensure dev server is running
npm run dev

# In another terminal, trigger a manual refresh via API
curl -X POST http://localhost:5000/api/refresh

# Or use the UI "Refresh" button on the dashboard
```

Expected output:
- ML backend should return 5 large caps, 5 mid caps, 5 small caps
- Total: 15 recommendations
- Each category displays 5 stocks on the dashboard

## Confidence Scores

**Important**: The system will now return exactly 5 stocks per category **regardless of confidence score**. Previously, it might have filtered stocks below a certain confidence threshold, but now it will always return the top 5 candidates from the ML backend for each market cap category.

The ML backend's `min_score=60` parameter in the API call ensures only stocks with at least 60% confidence from the ML model are considered, but the top 5 from each category will be selected even if some are near this threshold.

## Verification

Check the recommendation count:
```bash
npx tsx server/verifySectors.ts
```

Should show 15 total recommendations (5 large, 5 mid, 5 small).
