import sqlite3

conn = sqlite3.connect('data/stocks.db')
cursor = conn.cursor()

# Search for stocks with FIG or similar
cursor.execute("SELECT ticker, name FROM stocks WHERE ticker LIKE 'FIG%' OR name LIKE '%Figurative%' ORDER BY ticker")
results = cursor.fetchall()

print('\nStocks matching "FIG":')
if results:
    for t, n in results:
        print(f'{t:8} {n}')
else:
    print('No matches found')

# Show some random stocks that DO have data
print('\n\nSample stocks with data (random 10):')
cursor.execute("SELECT ticker, name FROM stocks WHERE name IS NOT NULL LIMIT 10")
results = cursor.fetchall()
for t, n in results:
    print(f'{t:8} {n}')

conn.close()
