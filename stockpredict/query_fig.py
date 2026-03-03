"""Query all historical data for a specific ticker (FIG)"""
import sqlite3
from datetime import datetime

db_path = "data/stocks.db"
ticker = "FIGR"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\n" + "="*80)
    print(f"COMPLETE HISTORICAL DATA FOR {ticker}")
    print("="*80)
    
    # Stock master info
    print("\n📊 STOCK INFORMATION")
    print("-"*80)
    cursor.execute("""
        SELECT ticker, name, sector, industry, market_cap, current_price, 
               avg_volume, last_updated 
        FROM stocks 
        WHERE ticker = ?
    """, (ticker,))
    stock = cursor.fetchone()
    
    if stock:
        ticker_sym, name, sector, industry, mcap, price, vol, updated = stock
        print(f"Ticker:       {ticker_sym}")
        print(f"Name:         {name or 'N/A'}")
        print(f"Sector:       {sector or 'N/A'}")
        print(f"Industry:     {industry or 'N/A'}")
        print(f"Market Cap:   ${mcap:,.0f}" if mcap else "Market Cap:   N/A")
        print(f"Last Price:   ${price:.2f}" if price else "Last Price:   N/A")
        print(f"Avg Volume:   {vol:,.0f}" if vol else "Avg Volume:   N/A")
        print(f"Last Updated: {updated}")
    else:
        print(f"No stock record found for {ticker}")
        exit(0)
    
    # Daily price history
    print("\n" + "="*80)
    print("📈 DAILY PRICE HISTORY (OHLCV)")
    print("="*80)
    cursor.execute("""
        SELECT COUNT(*) 
        FROM daily_data 
        WHERE ticker = ?
    """, (ticker,))
    count = cursor.fetchone()[0]
    print(f"Total records: {count}")
    
    if count > 0:
        cursor.execute("""
            SELECT date, open, high, low, close, volume, adj_close
            FROM daily_data 
            WHERE ticker = ?
            ORDER BY date ASC
        """, (ticker,))
        daily_data = cursor.fetchall()
        
        print(f"\nDate Range: {daily_data[0][0]} to {daily_data[-1][0]}")
        print("\nFirst 5 days:")
        print("-"*80)
        print(f"{'Date':12} {'Open':>10} {'High':>10} {'Low':>10} {'Close':>10} {'Volume':>15} {'Adj Close':>10}")
        print("-"*80)
        for date, o, h, l, c, vol, adj in daily_data[:5]:
            o_str = f"${o:>9.2f}" if o else "      N/A"
            h_str = f"${h:>9.2f}" if h else "      N/A"
            l_str = f"${l:>9.2f}" if l else "      N/A"
            c_str = f"${c:>9.2f}" if c else "      N/A"
            vol_str = f"{vol:>14,.0f}" if vol else "           N/A"
            adj_str = f"${adj:>9.2f}" if adj else "      N/A"
            print(f"{date} {o_str} {h_str} {l_str} {c_str} {vol_str} {adj_str}")
        
        print("\n...")
        print("\nLast 5 days:")
        print("-"*80)
        print(f"{'Date':12} {'Open':>10} {'High':>10} {'Low':>10} {'Close':>10} {'Volume':>15} {'Adj Close':>10}")
        print("-"*80)
        for date, o, h, l, c, vol, adj in daily_data[-5:]:
            o_str = f"${o:>9.2f}" if o else "      N/A"
            h_str = f"${h:>9.2f}" if h else "      N/A"
            l_str = f"${l:>9.2f}" if l else "      N/A"
            c_str = f"${c:>9.2f}" if c else "      N/A"
            vol_str = f"{vol:>14,.0f}" if vol else "           N/A"
            adj_str = f"${adj:>9.2f}" if adj else "      N/A"
            print(f"{date} {o_str} {h_str} {l_str} {c_str} {vol_str} {adj_str}")
        
        # Calculate statistics
        closes = [c for _, _, _, _, c, _, _ in daily_data if c is not None]
        if closes:
            print("\n" + "-"*80)
            print("PRICE STATISTICS")
            print("-"*80)
            print(f"Highest Close:  ${max(closes):.2f}")
            print(f"Lowest Close:   ${min(closes):.2f}")
            print(f"Average Close:  ${sum(closes)/len(closes):.2f}")
            print(f"Price Change:   ${closes[-1] - closes[0]:.2f} ({((closes[-1]/closes[0] - 1) * 100):.2f}%)")
    
    # Fundamental data
    print("\n" + "="*80)
    print("💰 FUNDAMENTAL DATA HISTORY")
    print("="*80)
    cursor.execute("""
        SELECT COUNT(*) 
        FROM fundamentals 
        WHERE ticker = ?
    """, (ticker,))
    count = cursor.fetchone()[0]
    print(f"Total records: {count}")
    
    if count > 0:
        cursor.execute("""
            SELECT date, pe_ratio, forward_pe, pb_ratio, ps_ratio, peg_ratio,
                   revenue_growth, earnings_growth, roe, roa, debt_to_equity,
                   current_ratio, quick_ratio, gross_margin, operating_margin,
                   profit_margin, free_cash_flow, operating_cash_flow,
                   book_value, enterprise_value, shares_outstanding
            FROM fundamentals 
            WHERE ticker = ?
            ORDER BY date DESC
            LIMIT 5
        """, (ticker,))
        fundamentals = cursor.fetchall()
        
        for fund in fundamentals:
            (date, pe, fpe, pb, ps, peg, rev_g, earn_g, roe, roa, de, 
             cr, qr, gm, om, pm, fcf, ocf, bv, ev, shares) = fund
            
            print(f"\n📅 {date}")
            print("-"*80)
            print("Valuation Metrics:")
            print(f"  PE Ratio:        {pe:.2f}" if pe else "  PE Ratio:        N/A")
            print(f"  Forward PE:      {fpe:.2f}" if fpe else "  Forward PE:      N/A")
            print(f"  P/B Ratio:       {pb:.2f}" if pb else "  P/B Ratio:       N/A")
            print(f"  P/S Ratio:       {ps:.2f}" if ps else "  P/S Ratio:       N/A")
            print(f"  PEG Ratio:       {peg:.2f}" if peg else "  PEG Ratio:       N/A")
            
            print("\nGrowth Metrics:")
            print(f"  Revenue Growth:  {rev_g*100:.2f}%" if rev_g else "  Revenue Growth:  N/A")
            print(f"  Earnings Growth: {earn_g*100:.2f}%" if earn_g else "  Earnings Growth: N/A")
            
            print("\nQuality Metrics:")
            print(f"  ROE:             {roe*100:.2f}%" if roe else "  ROE:             N/A")
            print(f"  ROA:             {roa*100:.2f}%" if roa else "  ROA:             N/A")
            print(f"  Debt/Equity:     {de:.2f}" if de else "  Debt/Equity:     N/A")
            print(f"  Current Ratio:   {cr:.2f}" if cr else "  Current Ratio:   N/A")
            print(f"  Quick Ratio:     {qr:.2f}" if qr else "  Quick Ratio:     N/A")
            
            print("\nProfitability Metrics:")
            print(f"  Gross Margin:    {gm*100:.2f}%" if gm else "  Gross Margin:    N/A")
            print(f"  Operating Mgn:   {om*100:.2f}%" if om else "  Operating Mgn:   N/A")
            print(f"  Profit Margin:   {pm*100:.2f}%" if pm else "  Profit Margin:   N/A")
            
            print("\nCash Flow:")
            print(f"  Free Cash Flow:  ${fcf:,.0f}" if fcf else "  Free Cash Flow:  N/A")
            print(f"  Operating CF:    ${ocf:,.0f}" if ocf else "  Operating CF:    N/A")
            
            print("\nOther:")
            print(f"  Book Value:      ${bv:.2f}" if bv else "  Book Value:      N/A")
            print(f"  Enterprise Val:  ${ev:,.0f}" if ev else "  Enterprise Val:  N/A")
            print(f"  Shares Out:      {shares:,.0f}" if shares else "  Shares Out:      N/A")
    
    # Technical indicators
    print("\n" + "="*80)
    print("📊 TECHNICAL INDICATORS")
    print("="*80)
    try:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM technical_indicators 
            WHERE ticker = ?
        """, (ticker,))
        count = cursor.fetchone()[0]
        print(f"Total records: {count}")
        
        if count > 0:
            cursor.execute("""
                SELECT date, sma_20, sma_50, sma_200, ema_12, ema_26,
                       rsi, macd, macd_signal, bollinger_upper, bollinger_lower
                FROM technical_indicators 
                WHERE ticker = ?
                ORDER BY date DESC
                LIMIT 5
            """, (ticker,))
            indicators = cursor.fetchall()
            
            print("\nMost Recent Indicators:")
            print("-"*80)
            for ind in indicators:
                date, sma20, sma50, sma200, ema12, ema26, rsi, macd, macd_sig, bb_up, bb_low = ind
                print(f"\n📅 {date}")
                print(f"  SMA-20:  ${sma20:.2f}" if sma20 else "  SMA-20:  N/A")
                print(f"  SMA-50:  ${sma50:.2f}" if sma50 else "  SMA-50:  N/A")
                print(f"  SMA-200: ${sma200:.2f}" if sma200 else "  SMA-200: N/A")
                print(f"  RSI:     {rsi:.2f}" if rsi else "  RSI:     N/A")
                print(f"  MACD:    {macd:.4f}" if macd else "  MACD:    N/A")
    except sqlite3.OperationalError:
        print("No technical indicators table found")
    
    # Predictions
    print("\n" + "="*80)
    print("🔮 ML PREDICTIONS")
    print("="*80)
    try:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM predictions 
            WHERE ticker = ?
        """, (ticker,))
        count = cursor.fetchone()[0]
        print(f"Total predictions: {count}")
        
        if count > 0:
            cursor.execute("""
                SELECT date, prediction, confidence, target_price, 
                       prediction_horizon, model_version
                FROM predictions 
                WHERE ticker = ?
                ORDER BY date DESC
                LIMIT 10
            """, (ticker,))
            predictions = cursor.fetchall()
            
            print("\nRecent Predictions:")
            print("-"*80)
            for pred in predictions:
                date, prediction, confidence, target, horizon, version = pred
                print(f"{date} | {prediction} | Confidence: {confidence:.2%}" if confidence 
                      else f"{date} | {prediction}")
    except sqlite3.OperationalError:
        print("No predictions table found")
    
    print("\n" + "="*80)
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"Database error: {e}")
except FileNotFoundError:
    print(f"Database file '{db_path}' not found")
