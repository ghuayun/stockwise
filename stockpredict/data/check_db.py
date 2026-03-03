"""Check stocks.db database content and date ranges"""
import sqlite3
from datetime import datetime

conn = sqlite3.connect('stocks.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cursor.fetchall()]
print(f"\n{'='*60}")
print(f"Tables in database: {tables}")
print(f"{'='*60}\n")

# Check each table
for table in tables:
    print(f"\n📊 Table: {table}")
    print(f"{'-'*60}")
    
    # Count rows
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    print(f"  Total rows: {count:,}")
    
    if count > 0:
        # Get column names
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Check for date columns
        date_columns = [col for col in columns if 'date' in col.lower()]
        
        if date_columns:
            for date_col in date_columns:
                try:
                    # Get min and max dates
                    cursor.execute(f"SELECT MIN({date_col}), MAX({date_col}) FROM {table}")
                    min_date, max_date = cursor.fetchone()
                    
                    if min_date and max_date:
                        print(f"  {date_col}:")
                        print(f"    Min: {min_date}")
                        print(f"    Max: {max_date}")
                except Exception as e:
                    print(f"  Error checking {date_col}: {e}")
        
        # Show sample row
        try:
            cursor.execute(f"SELECT * FROM {table} LIMIT 1")
            sample = cursor.fetchone()
            print(f"  Columns: {', '.join(columns)}")
        except Exception as e:
            print(f"  Error: {e}")

conn.close()
print(f"\n{'='*60}\n")
