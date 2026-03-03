# Daily Update Job Scheduling Guide

This guide explains how to schedule the `daily_update.py` script to run automatically after market close.

## What does daily_update.py do?

The daily update pipeline:
1. **Fetches latest stock data** from Yahoo Finance for all NASDAQ stocks
2. **Calculates technical indicators** (RSI, MACD, Bollinger Bands, etc.)
3. **Runs stock screening** to identify promising candidates
4. **Generates ML predictions** for future price movements

**Recommended Schedule:** 5:00 PM EST (after market closes at 4:00 PM)

---

## Option 1: Windows Task Scheduler (Recommended)

Best for production use - runs reliably even if you log off.

### Setup (One-time):

```powershell
# Run PowerShell as Administrator
cd D:\git\StockWiseInvest\stockpredict
.\schedule-daily-update.ps1
```

### Customization:

```powershell
# Custom time (e.g., 6:30 PM)
.\schedule-daily-update.ps1 -Time "18:30"

# Custom task name
.\schedule-daily-update.ps1 -TaskName "MyDailyUpdate"
```

### Management Commands:

```powershell
# Run immediately (test)
Start-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate"

# View task details
Get-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate" | Format-List

# View last run result
Get-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate" | Get-ScheduledTaskInfo

# Disable temporarily
Disable-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate"

# Enable again
Enable-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate"

# Remove task
Unregister-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate" -Confirm:$false
```

### GUI Management:
1. Open Task Scheduler: Press `Win + R`, type `taskschd.msc`
2. Find "StockWiseInvest-DailyUpdate" in the task list
3. Right-click for options (Run, Edit, Disable, Delete)

---

## Option 2: Python Scheduler Service

Alternative Python-based scheduler that runs as a background process.

### Start the Scheduler:

```powershell
cd D:\git\StockWiseInvest\stockpredict

# Start with default schedule (5:00 PM weekdays)
.\start-scheduler.ps1

# Custom time
.\start-scheduler.ps1 -Time "18:30"
```

### Stop the Scheduler:

```powershell
.\stop-scheduler.ps1
```

### Test Immediately:

```powershell
.\.venv\Scripts\python.exe scheduler_service.py --test
```

### View Logs:

```powershell
# Scheduler logs
Get-Content logs\scheduler_stdout.log -Tail 20

# Daily update logs (from scheduled runs)
Get-Content logs\scheduler_2025-11-10.log -Tail 50
```

### Advanced Options:

```powershell
# Run on weekends too
.\.venv\Scripts\python.exe scheduler_service.py --time 17:00 --weekend

# Custom time
.\.venv\Scripts\python.exe scheduler_service.py --time 18:30
```

---

## Option 3: Manual Execution

Run the update manually whenever needed:

```powershell
cd D:\git\StockWiseInvest\stockpredict
.\.venv\Scripts\python.exe scripts\daily_update.py
```

---

## Comparison

| Feature | Windows Task Scheduler | Python Scheduler | Manual |
|---------|----------------------|------------------|--------|
| Runs when logged off | ✅ Yes | ❌ No | ❌ No |
| Easy setup | ✅ One command | ✅ One command | N/A |
| Cross-platform | ❌ Windows only | ✅ Works anywhere | ✅ Works anywhere |
| Background service | ✅ System service | ✅ Python process | N/A |
| Best for | Production | Development/Testing | One-off runs |

---

## Logs

All execution logs are stored in `logs/` directory:

```powershell
# View today's scheduler log
Get-Content logs\scheduler_2025-11-10.log

# View daily update logs
Get-Content logs\daily_update.log

# View recent errors
Get-Content logs\scheduler_stderr.log -Tail 20
```

---

## Troubleshooting

### Task doesn't run at scheduled time

1. Check task status:
   ```powershell
   Get-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate" | Format-List
   ```

2. View last run result:
   ```powershell
   Get-ScheduledTask -TaskName "StockWiseInvest-DailyUpdate" | Get-ScheduledTaskInfo
   ```

3. Check logs in `logs/` directory

### Python environment not found

Ensure virtual environment is activated:
```powershell
cd D:\git\StockWiseInvest\stockpredict
.\.venv\Scripts\Activate.ps1
```

### Database locked error

Make sure no other processes are using the database:
```powershell
# Stop ML backend temporarily
.\stop-ml.ps1

# Run update
.\.venv\Scripts\python.exe scripts\daily_update.py

# Restart ML backend
.\start-ml.ps1
```

---

## Integration with Main App

The main Express.js app (in `server/scheduler.ts`) also has its own scheduler that:
- Refreshes recommendations every 6 hours
- Calls the ML backend API at `http://localhost:8000/api/candidates`

The `daily_update.py` keeps the ML backend's database fresh with:
- Latest stock prices
- Updated technical indicators
- Current screening scores
- Fresh ML predictions

**Both schedulers work together:**
- `daily_update.py` → Updates ML backend data (once daily)
- `server/scheduler.ts` → Fetches recommendations from ML backend (every 6 hours)

---

## Best Practice

For production deployment:
1. ✅ Use **Windows Task Scheduler** for reliability
2. ✅ Schedule for **5:00 PM EST** (after market close)
3. ✅ Monitor logs regularly
4. ✅ Keep ML backend running (`.\start-ml.ps1`)
5. ✅ Ensure database has sufficient disk space

---

## Quick Start (TL;DR)

```powershell
# One-time setup (run as Administrator)
cd D:\git\StockWiseInvest\stockpredict
.\schedule-daily-update.ps1

# Done! Task will run automatically at 5:00 PM on weekdays
```
