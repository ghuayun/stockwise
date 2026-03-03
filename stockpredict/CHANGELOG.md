# Changelog

## 2025-10-04 - Configuration Updates

### Changed
- **Reduced batch size from 100 to 50 tickers**
  - Updated `.env`: `BATCH_SIZE=50`
  - With 4,024 NASDAQ stocks, this creates ~81 batches (vs. 41 batches before)
  - Reduces memory usage and API load per batch

- **Added rate limit handling with automatic retry**
  - Modified `app/services/data_fetcher.py::fetch_stock_batch()`
  - Detects rate limit errors (HTTP 429, "rate limit", "too many requests")
  - Automatically retries up to 3 times with 5-second delays
  - Logs warnings and errors for monitoring

- **Updated documentation**
  - README.md now reflects batch size of 50
  - Added rate limit handling to features list
  - Updated configuration example with `BATCH_SIZE` parameter

### Impact
- **Daily update duration**: Increased from ~15-20 minutes to ~30-35 minutes
  - 81 batches × 10 seconds = ~13.5 minutes of delays alone
  - Plus fetch/processing time
- **Reliability**: Improved with automatic retry on rate limits
- **Resource usage**: Reduced memory footprint per batch
- **Rate limit compliance**: Better adherence to API limits

### Usage
No code changes needed. The system will automatically use the new batch size on next run:
```bash
python scripts/daily_update.py
```

To manually adjust batch size, edit `.env`:
```env
BATCH_SIZE=50  # Adjust as needed (25-100 recommended)
```
