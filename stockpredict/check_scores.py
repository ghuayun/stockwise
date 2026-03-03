from app.core.database import SessionLocal
from app.models.screening_score import ScreeningScore
from datetime import datetime

db = SessionLocal()
dates = db.query(ScreeningScore.date).distinct().all()
print('Dates in screening_score table:')
for d in dates:
    print(d[0])

print(f'\nToday is: {datetime.now().date()}')
print(f'Total scores: {db.query(ScreeningScore).count()}')

# Check scores with passes_basic_filters
passed = db.query(ScreeningScore).filter(ScreeningScore.passes_basic_filters == 1.0).count()
print(f'Scores passing basic filters: {passed}')

db.close()
