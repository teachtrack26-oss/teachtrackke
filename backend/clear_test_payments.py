from database import SessionLocal
from models import Payment

def clear_test_payments():
    db = SessionLocal()
    try:
        # Delete payments created by the verification script
        # They have checkout_request_id starting with TEST_CHECKOUT_
        # or description "Test Payment"
        
        print("Searching for test payments...")
        
        payments_to_delete = db.query(Payment).filter(
            (Payment.checkout_request_id.like("TEST_CHECKOUT_%")) | 
            (Payment.description == "Test Payment")
        ).all()
        
        count = len(payments_to_delete)
        
        if count > 0:
            print(f"Found {count} test payments. Deleting...")
            for payment in payments_to_delete:
                db.delete(payment)
            db.commit()
            print("✅ Test payments deleted successfully.")
        else:
            print("No test payments found.")
            
    except Exception as e:
        print(f"❌ Error deleting test payments: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_test_payments()
