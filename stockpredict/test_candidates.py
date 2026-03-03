from app.core.database import get_db, init_db
from app.services.screener import Screener
from app.ml.predictor import StockPredictor

init_db()
db = next(get_db())

screener = Screener(db)
predictor = StockPredictor(db)

# Get top candidates from screener with Technology sector filter
candidates = screener.get_top_candidates(limit=100, sector='Technology')
print(f"Got {len(candidates)} candidates from screener")

# Categorize by market cap and add predictions
large_caps = []
mid_caps = []
small_caps = []

large_cap_count = 5
mid_cap_count = 5
small_cap_count = 5
timeframe = "1m"

for i, candidate in enumerate(candidates):
    ticker = candidate['ticker']
    market_cap = candidate.get('market_cap', 0) or 0
    
    print(f"{i+1}. Processing {ticker}: market_cap={market_cap:,.0f}")
    
    # Get predictions
    try:
        predictions = predictor.get_stock_predictions(ticker)
        print(f"   Got predictions: {list(predictions.keys())}")
    except Exception as pred_err:
        print(f"   ERROR getting predictions: {pred_err}")
        predictions = {}
    
    # Add prediction for requested timeframe
    if timeframe in predictions:
        candidate['prediction'] = predictions[timeframe]
    else:
        candidate['prediction'] = None
    
    # Add all timeframe predictions
    candidate['all_predictions'] = predictions
    
    # Add market cap category label
    if market_cap >= 10_000_000_000:  # >= $10B
        candidate['market_cap_category'] = 'large'
        if len(large_caps) < large_cap_count:
            large_caps.append(candidate)
            print(f"   -> Added to LARGE ({len(large_caps)}/{large_cap_count})")
    elif market_cap >= 2_000_000_000:  # $2B - $10B
        candidate['market_cap_category'] = 'mid'
        if len(mid_caps) < mid_cap_count:
            mid_caps.append(candidate)
            print(f"   -> Added to MID ({len(mid_caps)}/{mid_cap_count})")
    elif market_cap >= 300_000_000:  # $300M - $2B
        candidate['market_cap_category'] = 'small'
        if len(small_caps) < small_cap_count:
            small_caps.append(candidate)
            print(f"   -> Added to SMALL ({len(small_caps)}/{small_cap_count})")
    
    # Stop if we have enough of each category
    if (len(large_caps) >= large_cap_count and 
        len(mid_caps) >= mid_cap_count and 
        len(small_caps) >= small_cap_count):
        print("Got enough of each category, stopping")
        break

print(f"\n=== Results ===")
print(f"Large caps: {len(large_caps)}")
print(f"Mid caps: {len(mid_caps)}")
print(f"Small caps: {len(small_caps)}")

# Try to serialize as JSON (this is what the API does)
import json
result = {
    "count": len(large_caps) + len(mid_caps) + len(small_caps),
    "timeframe": timeframe,
    "categories": {
        "large": len(large_caps),
        "mid": len(mid_caps),
        "small": len(small_caps)
    },
    "large_caps": large_caps,
    "mid_caps": mid_caps,
    "small_caps": small_caps,
}

try:
    json_str = json.dumps(result)
    print(f"\nJSON serialization: SUCCESS ({len(json_str)} chars)")
except Exception as e:
    print(f"\nJSON serialization FAILED: {e}")
    # Find what can't be serialized
    for k, v in result.items():
        try:
            json.dumps({k: v})
        except Exception as e2:
            print(f"  Problem with key '{k}': {e2}")
            if isinstance(v, list):
                for i, item in enumerate(v):
                    try:
                        json.dumps(item)
                    except Exception as e3:
                        print(f"    Item {i}: {e3}")
                        for ik, iv in item.items():
                            try:
                                json.dumps({ik: iv})
                            except:
                                print(f"      Field '{ik}' = {type(iv)} -> {iv}")
