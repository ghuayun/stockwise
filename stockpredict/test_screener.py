from app.core.database import SessionLocal
from app.services.screener import Screener
import json

db = SessionLocal()
screener = Screener(db)
candidates = screener.get_top_candidates(limit=5)

print(f"Found {len(candidates)} candidates")
print("\nFirst 3 candidates:")
for candidate in candidates[:3]:
    print(json.dumps(candidate, indent=2, default=str))

db.close()
