"""
Test M-Pesa Integration - Simulates a callback for testing

This script:
1. Tests your M-Pesa credentials
2. Can simulate a callback to test the full payment flow
"""

import requests
import sys

# Your backend URL
BACKEND_URL = "http://localhost:8000"

def test_credentials():
    """Test if M-Pesa credentials are valid"""
    print("\n=== Testing M-Pesa Credentials ===")
    
    from mpesa_utils import mpesa_client
    
    try:
        token = mpesa_client.get_access_token()
        print(f"[SUCCESS] Access token obtained: {token[:20]}...")
        return True
    except Exception as e:
        print(f"[FAILED] Could not get access token: {e}")
        return False

def simulate_successful_callback(checkout_request_id: str):
    """
    Simulate a successful M-Pesa callback.
    Use this to test the full payment flow without waiting for Safaricom.
    """
    print(f"\n=== Simulating Successful Callback for {checkout_request_id} ===")
    
    callback_data = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "test-merchant-id",
                "CheckoutRequestID": checkout_request_id,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 5},
                        {"Name": "MpesaReceiptNumber", "Value": "SIM1234TEST"},
                        {"Name": "TransactionDate", "Value": 20251215072500},
                        {"Name": "PhoneNumber", "Value": 254705204870}
                    ]
                }
            }
        }
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/v1/payments/callback",
            json=callback_data,
            timeout=10
        )
        print(f"Response Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("\n[SUCCESS] Callback processed! Check your database - payment should be COMPLETED")
        return response.status_code == 200
    except Exception as e:
        print(f"[FAILED] Error: {e}")
        return False

def simulate_cancelled_callback(checkout_request_id: str):
    """Simulate a cancelled (user rejected) callback"""
    print(f"\n=== Simulating Cancelled Callback for {checkout_request_id} ===")
    
    callback_data = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "test-merchant-id",
                "CheckoutRequestID": checkout_request_id,
                "ResultCode": 1032,
                "ResultDesc": "Request cancelled by user"
            }
        }
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/v1/payments/callback",
            json=callback_data,
            timeout=10
        )
        print(f"Response Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"[FAILED] Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("M-Pesa Integration Test Tool")
    print("=" * 60)
    
    # Test credentials first
    creds_ok = test_credentials()
    
    if not creds_ok:
        print("\n[ERROR] Credentials are invalid. Please check your config.py")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("OPTIONS:")
    print("1. Run: python test_mpesa_callback.py <checkout_request_id>")
    print("   - Simulates a SUCCESSFUL payment callback")
    print("")
    print("2. Run: python test_mpesa_callback.py <checkout_request_id> cancel")
    print("   - Simulates a CANCELLED payment callback")
    print("=" * 60)
    
    if len(sys.argv) >= 2:
        checkout_id = sys.argv[1]
        
        if len(sys.argv) >= 3 and sys.argv[2] == "cancel":
            simulate_cancelled_callback(checkout_id)
        else:
            simulate_successful_callback(checkout_id)
    else:
        print("\nNo checkout_request_id provided.")
        print("\nTo simulate a payment, use the checkout_request_id from your last STK push.")
        print("Example: python test_mpesa_callback.py ws_CO_15122025072428531705204870")
