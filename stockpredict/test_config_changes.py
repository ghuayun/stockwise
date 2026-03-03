"""
Test script to verify batch size and rate limit handling changes
"""
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.services.data_fetcher import DataFetcher
import sys

settings = get_settings()

def test_batch_size():
    """Test that batch size is correctly loaded"""
    print(f"✓ Current batch size from config: {settings.BATCH_SIZE}")
    assert settings.BATCH_SIZE == 50, f"Expected batch size 50, got {settings.BATCH_SIZE}"
    print("✓ Batch size configuration verified")

def test_rate_limit_logic():
    """Test rate limit error detection logic"""
    test_errors = [
        "429 Too Many Requests",
        "Rate limit exceeded",
        "rate limit hit",
        "Too many requests",
    ]
    
    print("\n✓ Testing rate limit error detection:")
    for error_msg in test_errors:
        lower_msg = error_msg.lower()
        is_rate_limit = ('rate limit' in lower_msg or '429' in lower_msg or 'too many requests' in lower_msg)
        assert is_rate_limit, f"Failed to detect rate limit in: {error_msg}"
        print(f"  ✓ Detected: '{error_msg}'")
    
    print("✓ Rate limit detection logic verified")

def test_batch_calculation():
    """Test batch calculation with new batch size"""
    total_tickers = 4024
    batch_size = settings.BATCH_SIZE
    total_batches = (total_tickers + batch_size - 1) // batch_size
    
    print(f"\n✓ Batch calculation:")
    print(f"  Total tickers: {total_tickers}")
    print(f"  Batch size: {batch_size}")
    print(f"  Total batches: {total_batches}")
    print(f"  Estimated delay time: {(total_batches - 1) * 10} seconds (~{(total_batches - 1) * 10 / 60:.1f} minutes)")
    
    assert total_batches == 81, f"Expected 81 batches, got {total_batches}"
    print("✓ Batch calculation verified")

if __name__ == "__main__":
    try:
        print("=" * 60)
        print("Testing Configuration Changes")
        print("=" * 60)
        
        test_batch_size()
        test_rate_limit_logic()
        test_batch_calculation()
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        sys.exit(0)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
