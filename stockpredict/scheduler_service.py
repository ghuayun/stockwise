"""
Python-based scheduler for daily_update.py
Runs as a background service and executes daily_update at specified time.
This is an alternative to Windows Task Scheduler.

Usage:
  python scheduler_service.py           # Run with default schedule (5:00 PM weekdays)
  python scheduler_service.py --time 17:30  # Custom time
  python scheduler_service.py --test    # Run immediately for testing
"""
import sys
import time
import schedule
import argparse
from pathlib import Path
from datetime import datetime
from loguru import logger

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from scripts.daily_update import run_daily_update


def job():
    """Execute the daily update job"""
    logger.info("="*80)
    logger.info(f"SCHEDULED JOB TRIGGERED at {datetime.now()}")
    logger.info("="*80)
    
    try:
        run_daily_update()
        logger.success("Daily update completed successfully")
    except Exception as e:
        logger.error(f"Daily update failed: {e}")
        logger.exception("Full traceback:")


def main():
    parser = argparse.ArgumentParser(description="Daily update scheduler service")
    parser.add_argument(
        "--time",
        default="17:00",
        help="Time to run daily update (24-hour format, e.g., 17:00 for 5 PM)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run job immediately for testing"
    )
    parser.add_argument(
        "--weekend",
        action="store_true",
        help="Also run on weekends (default: weekdays only)"
    )
    
    args = parser.parse_args()
    
    # Configure logger
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(exist_ok=True)
    
    logger.remove()  # Remove default handler
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level="INFO"
    )
    logger.add(
        log_dir / "scheduler_{time:YYYY-MM-DD}.log",
        rotation="1 day",
        retention="30 days",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}"
    )
    
    if args.test:
        logger.info("Running in TEST mode - executing job immediately")
        job()
        return
    
    # Schedule the job
    logger.info("Starting StockWiseInvest Daily Update Scheduler")
    logger.info(f"Schedule: {args.time} {'every day' if args.weekend else 'on weekdays (Mon-Fri)'}")
    logger.info("Press Ctrl+C to stop the scheduler")
    logger.info("="*80)
    
    if args.weekend:
        # Run every day
        schedule.every().day.at(args.time).do(job)
    else:
        # Run only on weekdays
        schedule.every().monday.at(args.time).do(job)
        schedule.every().tuesday.at(args.time).do(job)
        schedule.every().wednesday.at(args.time).do(job)
        schedule.every().thursday.at(args.time).do(job)
        schedule.every().friday.at(args.time).do(job)
    
    # Display next run time
    next_run = schedule.next_run()
    if next_run:
        logger.info(f"Next scheduled run: {next_run}")
    
    # Keep running
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logger.info("\nScheduler stopped by user")
        sys.exit(0)


if __name__ == "__main__":
    main()
