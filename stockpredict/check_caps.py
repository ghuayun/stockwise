import sqlite3

conn = sqlite3.connect('data/stocks.db')
cursor = conn.cursor()

# Check market cap distribution
cursor.execute('''
    SELECT 
        CASE 
            WHEN market_cap >= 10000000000 THEN 'Large (>10B)'
            WHEN market_cap >= 2000000000 THEN 'Mid (2B-10B)'
            WHEN market_cap >= 300000000 THEN 'Small (300M-2B)'
            WHEN market_cap > 0 THEN 'Micro (<300M)'
            ELSE 'No market cap'
        END as cap_category,
        COUNT(*) as count
    FROM stocks 
    GROUP BY cap_category
    ORDER BY count DESC
''')

print("=== Stocks by Market Cap Category ===")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check screening_scores table
cursor.execute('SELECT COUNT(*) FROM screening_scores')
print(f"\n=== Screening Scores: {cursor.fetchone()[0]} records ===")

cursor.execute('''
    SELECT s.ticker, st.market_cap 
    FROM screening_scores s 
    JOIN stocks st ON s.ticker = st.ticker 
    WHERE st.market_cap > 0 AND st.market_cap < 2000000000
    LIMIT 10
''')
mid_small = cursor.fetchall()
print(f"\nMid/Small cap stocks with screening scores: {len(mid_small)}")
for row in mid_small:
    print(f"  {row[0]}: ${row[1]:,.0f}")

# Check if screening scores have market cap filter
cursor.execute('''
    SELECT 
        CASE 
            WHEN st.market_cap >= 10000000000 THEN 'Large'
            WHEN st.market_cap >= 2000000000 THEN 'Mid'
            WHEN st.market_cap >= 300000000 THEN 'Small'
            ELSE 'Micro/None'
        END as cap,
        COUNT(*) 
    FROM screening_scores s
    JOIN stocks st ON s.ticker = st.ticker
    GROUP BY cap
''')
print("\n=== Screening Scores by Market Cap ===")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
