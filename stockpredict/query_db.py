"""Query the stocks.db database to see what historical data is stored"""
import sqlite3
from datetime import datetime

db_path = "data/stocks.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("STOCKS.DB DATABASE CONTENTS")
    print("="*60)
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"\n📋 Tables found: {len(tables)}")
    for table in tables:
        print(f"   - {table[0]}")
    
    # Stock master table
    print("\n" + "-"*60)
    print("📊 STOCKS TABLE")
    print("-"*60)
    cursor.execute("SELECT COUNT(*) FROM stocks")
    count = cursor.fetchone()[0]
    print(f"Total stocks: {count}")
    
    if count > 0:
        cursor.execute("""
            SELECT ticker, name, sector, industry, market_cap, current_price, 
                   avg_volume, last_updated 
            FROM stocks 
            ORDER BY last_updated DESC 
            LIMIT 5
        """)
        stocks = cursor.fetchall()
        print("\nMost recently updated stocks:")
        for stock in stocks:
            ticker, name, sector, industry, mcap, price, vol, updated = stock
            price_str = f"${price:>8.2f}" if price else "     N/A"
            print(f"  {ticker:6} | {(name or ticker)[:30]:30} | {price_str} | {updated}")
    
    # Daily data table
    print("\n" + "-"*60)
    print("📈 DAILY_DATA TABLE (Historical OHLCV)")
    print("-"*60)
    cursor.execute("SELECT COUNT(*) FROM daily_data")
    count = cursor.fetchone()[0]
    print(f"Total daily records: {count:,}")
    
    if count > 0:
        # Get date range
        cursor.execute("SELECT MIN(date), MAX(date) FROM daily_data")
        min_date, max_date = cursor.fetchone()
        print(f"Date range: {min_date} to {max_date}")
        
        # Get unique tickers
        cursor.execute("SELECT COUNT(DISTINCT ticker) FROM daily_data")
        ticker_count = cursor.fetchone()[0]
        print(f"Unique tickers with data: {ticker_count}")
        
        # Sample data for a few tickers
        cursor.execute("""
            SELECT ticker, COUNT(*) as days, MIN(date) as first_date, MAX(date) as last_date
            FROM daily_data 
            GROUP BY ticker 
            ORDER BY days DESC 
            LIMIT 5
        """)
        ticker_stats = cursor.fetchall()
        print("\nTop tickers by data points:")
        for ticker, days, first, last in ticker_stats:
            print(f"  {ticker:6} | {days:4} days | {first} to {last}")
        
        # Show sample recent data
        cursor.execute("""
            SELECT ticker, date, open, high, low, close, volume
            FROM daily_data 
            ORDER BY date DESC 
            LIMIT 5
        """)
        recent = cursor.fetchall()
        print("\nMost recent daily data:")
        for ticker, date, o, h, l, c, vol in recent:
            o_str = f"{o:8.2f}" if o else "    N/A"
            h_str = f"{h:8.2f}" if h else "    N/A"
            l_str = f"{l:8.2f}" if l else "    N/A"
            c_str = f"{c:8.2f}" if c else "    N/A"
            vol_str = f"{vol:12,.0f}" if vol else "         N/A"
            print(f"  {date} | {ticker:6} | O:{o_str} H:{h_str} L:{l_str} C:{c_str} | Vol:{vol_str}")
    
    # Fundamentals table
    print("\n" + "-"*60)
    print("💰 FUNDAMENTALS TABLE")
    print("-"*60)
    cursor.execute("SELECT COUNT(*) FROM fundamentals")
    count = cursor.fetchone()[0]
    print(f"Total fundamental records: {count}")
    
    if count > 0:
        cursor.execute("SELECT COUNT(DISTINCT ticker) FROM fundamentals")
        ticker_count = cursor.fetchone()[0]
        print(f"Unique tickers: {ticker_count}")
        
        cursor.execute("""
            SELECT ticker, date, pe_ratio, pb_ratio, debt_to_equity, roe, profit_margin
            FROM fundamentals 
            ORDER BY date DESC 
            LIMIT 5
        """)
        fundamentals = cursor.fetchall()
        print("\nRecent fundamental data:")
        for ticker, date, pe, pb, de, roe, pm in fundamentals:
            pe_str = f"{pe:.2f}" if pe else "N/A"
            pb_str = f"{pb:.2f}" if pb else "N/A"
            print(f"  {date} | {ticker:6} | PE:{pe_str:>6} PB:{pb_str:>6} ROE:{roe*100 if roe else 0:>5.1f}%")
    
    # Predictions table (if exists)
    print("\n" + "-"*60)
    print("🔮 PREDICTIONS TABLE (if exists)")
    print("-"*60)
    try:
        cursor.execute("SELECT COUNT(*) FROM predictions")
        count = cursor.fetchone()[0]
        print(f"Total predictions: {count}")
        
        if count > 0:
            cursor.execute("""
                SELECT ticker, date, prediction, confidence
                FROM predictions 
                ORDER BY date DESC 
                LIMIT 5
            """)
            predictions = cursor.fetchall()
            print("\nRecent predictions:")
            for ticker, date, pred, conf in predictions:
                print(f"  {date} | {ticker:6} | {pred} | Confidence: {conf:.2%}")
    except sqlite3.OperationalError:
        print("No predictions table found")
    
    print("\n" + "="*60)
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"Error: {e}")
except FileNotFoundError:
    print(f"Database file '{db_path}' not found")
