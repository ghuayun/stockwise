from app.core.database import get_db, init_db
from app.services.screener import Screener

init_db()
db = next(get_db())
screener = Screener(db)

# Test get_top_candidates with sector
print("Testing Technology sector:")
result = screener.get_top_candidates(limit=20, sector='Technology')
print(f'Technology candidates: {len(result)}')
for r in result[:5]:
    print(f"  {r['ticker']}: {r['sector']} - cap: {r['market_cap']}")

print("\nTesting without sector:")
result = screener.get_top_candidates(limit=20, sector=None)
print(f'All sectors: {len(result)}')
for r in result[:5]:
    print(f"  {r['ticker']}: {r['sector']} - cap: {r['market_cap']}")
