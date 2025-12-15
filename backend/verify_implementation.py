import sys
import os
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from dependencies import get_current_super_admin, get_current_user
from models import User, UserRole, Payment, PaymentStatus
from database import SessionLocal

# Mock User
class MockUser:
    id = 1  # Use an existing user ID to satisfy FK constraints
    email = "superadmin@test.com"
    full_name = "Test Super Admin"
    role = UserRole.SUPER_ADMIN
    is_admin = True

def mock_get_current_super_admin():
    return MockUser()

# Override dependency
app.dependency_overrides[get_current_super_admin] = mock_get_current_super_admin
app.dependency_overrides[get_current_user] = mock_get_current_super_admin

client = TestClient(app)

def test_pricing_config():
    print("\n--- Testing Pricing Config ---")
    # 1. Get Config
    response = client.get("/api/v1/admin/pricing-config")
    if response.status_code == 200:
        print("✅ GET /pricing-config: Success")
        print(f"   Current Config: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"❌ GET /pricing-config: Failed ({response.status_code})")
        print(response.text)
        return

    # 2. Update Config
    new_config = response.json()
    new_config["termly"]["price_kes"] = 400 # Change price
    
    response = client.put("/api/v1/admin/pricing-config", json=new_config)
    if response.status_code == 200:
        print("✅ PUT /pricing-config: Success")
        print(f"   Updated Config: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"❌ PUT /pricing-config: Failed ({response.status_code})")
        print(response.text)

def test_payment_monitoring():
    print("\n--- Testing Payment Monitoring ---")
    
    # 1. Get Stats
    response = client.get("/api/v1/admin/payments/stats")
    if response.status_code == 200:
        print("✅ GET /payments/stats: Success")
        print(f"   Stats: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"❌ GET /payments/stats: Failed ({response.status_code})")
        print(response.text)

    # 2. Get List
    response = client.get("/api/v1/admin/payments")
    if response.status_code == 200:
        print("✅ GET /payments: Success")
        data = response.json()
        print(f"   Total Payments: {data['total']}")
        if data['items']:
            first = data['items'][0]
            print("   Checking first item for new fields...")
            if 'result_desc' in first and 'mpesa_metadata' in first:
                print("✅ New fields (result_desc, mpesa_metadata) are present in response.")
            else:
                print("❌ New fields MISSING in response.")
                print(f"   Keys found: {list(first.keys())}")
    else:
        print(f"❌ GET /payments: Failed ({response.status_code})")
        print(response.text)

def test_mpesa_callback_integration():
    print("\n--- Testing M-Pesa Callback Integration ---")
    db = SessionLocal()
    try:
        # 1. Create a pending payment
        checkout_id = f"TEST_CHECKOUT_{int(datetime.now().timestamp())}"
        payment = Payment(
            user_id=1, # Assuming user 1 exists, or we might need to create one. 
                       # If user 1 doesn't exist, this might fail on FK constraint.
                       # Let's check if we can find a user first.
            amount=100,
            phone_number="254700000000",
            checkout_request_id=checkout_id,
            status=PaymentStatus.PENDING,
            description="Test Payment",
            reference="TERMLY"
        )
        
        # Try to find a valid user
        user = db.query(User).first()
        if not user:
            print("⚠️ No users found in DB. Skipping callback test (FK constraint).")
            return
            
        payment.user_id = user.id
        db.add(payment)
        db.commit()
        print(f"   Created pending payment with CheckoutRequestID: {checkout_id}")
        
        # 2. Simulate Callback
        import random
        import string
        random_receipt = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        
        callback_data = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "29115-34620561-1",
                    "CheckoutRequestID": checkout_id,
                    "ResultCode": 0,
                    "ResultDesc": "The service request is processed successfully.",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 100.00},
                            {"Name": "MpesaReceiptNumber", "Value": random_receipt},
                            {"Name": "TransactionDate", "Value": 20191219102115},
                            {"Name": "PhoneNumber", "Value": 254708374149}
                        ]
                    }
                }
            }
        }
        
        response = client.post("/api/v1/payments/callback", json=callback_data)
        if response.status_code == 200:
            print("✅ POST /payments/callback: Success")
        else:
            print(f"❌ POST /payments/callback: Failed ({response.status_code})")
            print(response.text)
            
        # 3. Verify DB Update
        db.refresh(payment)
        print("   Verifying DB updates...")
        if payment.status == PaymentStatus.COMPLETED:
            print("✅ Status updated to COMPLETED")
        else:
            print(f"❌ Status is {payment.status}")
            
        if payment.result_desc == "The service request is processed successfully.":
            print("✅ result_desc captured correctly")
        else:
            print(f"❌ result_desc mismatch: {payment.result_desc}")
            
        if payment.mpesa_metadata and "MpesaReceiptNumber" in str(payment.mpesa_metadata):
             print("✅ mpesa_metadata captured correctly")
        else:
             print(f"❌ mpesa_metadata missing or invalid: {payment.mpesa_metadata}")
             
    except Exception as e:
        print(f"❌ Error during callback test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    try:
        test_pricing_config()
        test_payment_monitoring()
        test_mpesa_callback_integration()
        print("\n✅ All Tests Completed.")
    except Exception as e:
        print(f"\n❌ Test Suite Failed: {e}")
