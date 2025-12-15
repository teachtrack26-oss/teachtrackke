from database import SessionLocal
from models import Payment

def list_payments():
    db = SessionLocal()
    try:
        payments = db.query(Payment).all()
        print(f"Found {len(payments)} payments:")
        for p in payments:
            print(f"ID: {p.id}, CheckoutID: {p.checkout_request_id}, Desc: {p.description}, Ref: {p.reference}, Code: {p.transaction_code}")
    finally:
        db.close()

if __name__ == "__main__":
    list_payments()
