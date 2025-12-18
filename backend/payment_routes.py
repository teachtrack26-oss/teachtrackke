from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import User, Payment, PaymentStatus, SubscriptionType, SubscriptionStatus
from schemas import PaymentInitiate, PaymentResponse, PaymentStatusResponse
from dependencies import get_current_user
from mpesa_utils import mpesa_client
from datetime import datetime, timedelta
from config import settings
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/payments", tags=["Payments"])

def send_payment_confirmation_email(user_email: str, user_name: str, plan: str, amount: float, transaction_code: str):
    """Send payment confirmation email"""
    try:
        plan_name = "Termly Pass" if plan == "TERMLY" else "Yearly Saver"
        plan_duration = "one term (4 months)" if plan == "TERMLY" else "one year"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success-icon {{ font-size: 48px; margin-bottom: 10px; }}
                .details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #6b7280; }}
                .value {{ font-weight: bold; color: #111827; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
                .btn {{ display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="success-icon">✅</div>
                    <h1>Payment Successful!</h1>
                </div>
                <div class="content">
                    <p>Dear {user_name or 'Teacher'},</p>
                    <p>Thank you for subscribing to TeachTrack! Your payment has been received and processed successfully.</p>
                    
                    <div class="details">
                        <div class="detail-row">
                            <span class="label">Plan:</span>
                            <span class="value">{plan_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Amount Paid:</span>
                            <span class="value">KES {amount:,.0f}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Transaction Code:</span>
                            <span class="value">{transaction_code}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Duration:</span>
                            <span class="value">{plan_duration}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Date:</span>
                            <span class="value">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</span>
                        </div>
                    </div>
                    
                    <p>You now have full access to all TeachTrack features including:</p>
                    <ul>
                        <li>✓ Unlimited scheme generation</li>
                        <li>✓ Complete lesson plans</li>
                        <li>✓ Records of work</li>
                        <li>✓ Download & print capabilities</li>
                        <li>✓ All curriculum templates</li>
                    </ul>
                    
                    <center>
                        <a href="{settings.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard</a>
                    </center>
                </div>
                <div class="footer">
                    <p>TeachTrack - Empowering Teachers with Smart Tools</p>
                    <p>If you have any questions, contact us at support@teachtrack.co.ke</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"🎉 Payment Confirmed - Welcome to TeachTrack {plan_name}!"
        msg['From'] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
        msg['To'] = user_email
        
        # Plain text version
        text_content = f"""
        Payment Successful!
        
        Dear {user_name or 'Teacher'},
        
        Thank you for subscribing to TeachTrack! Your payment has been received.
        
        Plan: {plan_name}
        Amount: KES {amount:,.0f}
        Transaction Code: {transaction_code}
        Duration: {plan_duration}
        
        You now have full access to all TeachTrack features.
        
        Visit your dashboard: {settings.FRONTEND_URL}/dashboard
        
        - TeachTrack Team
        """
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, user_email, msg.as_string())
            
        print(f"Payment confirmation email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send payment confirmation email: {str(e)}")
        return False

@router.post("/stk-push", response_model=PaymentResponse)
async def initiate_payment(
    payment_data: PaymentInitiate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initiate M-Pesa STK Push"""
    
    # Validate amount based on plan
    expected_amount = 0
    if payment_data.plan == "TERMLY":
        expected_amount = 1  # Testing: Change to 350 for production
    elif payment_data.plan == "YEARLY":
        expected_amount = 2  # Testing: Change to 1000 for production
    else:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
        
    # In production, ensure amount matches. For testing, we might allow small amounts.
    # if payment_data.amount != expected_amount:
    #     raise HTTPException(status_code=400, detail="Invalid amount for selected plan")

    try:
        # Initiate STK Push
        response = mpesa_client.initiate_stk_push(
            phone_number=payment_data.phone_number,
            amount=int(payment_data.amount),
            account_reference=f"TeachTrack-{current_user.id}",
            transaction_desc=f"Subscription for {payment_data.plan}"
        )
        
        # Save payment record
        new_payment = Payment(
            user_id=current_user.id,
            amount=payment_data.amount,
            phone_number=payment_data.phone_number,
            checkout_request_id=response['CheckoutRequestID'],
            merchant_request_id=response['MerchantRequestID'],
            status=PaymentStatus.PENDING,
            description=f"{payment_data.plan} Subscription",
            reference=payment_data.plan # Store plan type in reference for callback
        )
        
        db.add(new_payment)
        db.commit()
        
        return PaymentResponse(
            checkout_request_id=response['CheckoutRequestID'],
            merchant_request_id=response['MerchantRequestID'],
            response_code=response['ResponseCode'],
            response_description=response['ResponseDescription'],
            customer_message=response['CustomerMessage']
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/callback")
async def mpesa_callback(request: Request, db: Session = Depends(get_db)):
    """Handle M-Pesa Callback - This is called by Safaricom after STK push completes"""
    try:
        data = await request.json()
        print(f"[CALLBACK] M-Pesa Callback Received: {json.dumps(data, indent=2)}")
        
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        print(f"[CALLBACK] CheckoutID={checkout_request_id}, ResultCode={result_code}, Desc={result_desc}")
        
        # Find payment record
        payment = db.query(Payment).filter(Payment.checkout_request_id == checkout_request_id).first()
        
        if not payment:
            print(f"[WARN] Payment not found for CheckoutRequestID: {checkout_request_id}")
            return {"status": "error", "message": "Payment not found"}
        
        # If already processed (by status query), skip
        if payment.status != PaymentStatus.PENDING:
            print(f"[INFO] Payment {checkout_request_id} already processed as {payment.status.value}")
            return {"status": "success", "message": "Already processed"}
            
        # Always update result description
        payment.result_desc = result_desc
        
        if result_code == 0:
            # SUCCESS - Payment completed!
            payment.status = PaymentStatus.COMPLETED
            
            # Extract metadata from callback
            meta_data = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            metadata_dict = {item.get('Name'): item.get('Value') for item in meta_data}
            payment.mpesa_metadata = metadata_dict
            
            for item in meta_data:
                if item.get('Name') == 'MpesaReceiptNumber':
                    payment.transaction_code = item.get('Value')
            
            # Update User Subscription
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                plan_type = payment.reference
                
                if plan_type == "TERMLY":
                    user.subscription_type = SubscriptionType.INDIVIDUAL_BASIC
                elif plan_type == "YEARLY":
                    user.subscription_type = SubscriptionType.INDIVIDUAL_PREMIUM
                
                user.subscription_status = SubscriptionStatus.ACTIVE
                
            db.commit()
            print(f"[OK] Payment {checkout_request_id} COMPLETED via callback. User {user.id if user else 'unknown'} upgraded.")
            
            # Send payment confirmation email
            if user and user.email:
                send_payment_confirmation_email(
                    user_email=user.email,
                    user_name=user.full_name,
                    plan=plan_type,
                    amount=payment.amount,
                    transaction_code=payment.transaction_code or "N/A"
                )
            
        elif result_code == 1032:
            # User cancelled the STK push
            payment.status = PaymentStatus.CANCELLED
            db.commit()
            print(f"[CANCELLED] Payment {checkout_request_id} CANCELLED by user.")
            
        else:
            # Other errors = failed
            payment.status = PaymentStatus.FAILED
            db.commit()
            print(f"[FAILED] Payment {checkout_request_id} FAILED: {result_desc}")
            
        return {"status": "success"}
        
    except Exception as e:
        print(f"Error processing callback: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.get("/status/{checkout_request_id}", response_model=PaymentStatusResponse)
async def check_payment_status(
    checkout_request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check payment status - queries M-Pesa directly if still pending"""
    payment = db.query(Payment).filter(
        Payment.checkout_request_id == checkout_request_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # If already completed/failed/cancelled, return current status
    if payment.status != PaymentStatus.PENDING:
        return PaymentStatusResponse(
            status=payment.status,
            transaction_code=payment.transaction_code,
            amount=payment.amount,
            date=payment.updated_at
        )
    
    # If still pending, query M-Pesa directly for status
    try:
        result = mpesa_client.query_stk_status(checkout_request_id)
        result_code = str(result.get('ResultCode', ''))
        result_desc = result.get('ResultDesc', '')
        
        print(f"[STATUS] Query for {checkout_request_id}: ResultCode={result_code}, Desc={result_desc}")
        
        if result_code == '0':
            # Payment successful!
            payment.status = PaymentStatus.COMPLETED
            payment.result_desc = result_desc
            
            # Get transaction code from result
            payment.transaction_code = result.get('MpesaReceiptNumber', f"MPESA-{checkout_request_id[:10]}")
            
            # Store metadata if available
            if result.get('Amount') or result.get('PhoneNumber'):
                payment.mpesa_metadata = {
                    "Amount": result.get('Amount'),
                    "MpesaReceiptNumber": result.get('MpesaReceiptNumber'),
                    "TransactionDate": result.get('TransactionDate'),
                    "PhoneNumber": result.get('PhoneNumber')
                }
            
            # Update user subscription
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                plan_type = payment.reference
                if plan_type == "TERMLY":
                    user.subscription_type = SubscriptionType.INDIVIDUAL_BASIC
                elif plan_type == "YEARLY":
                    user.subscription_type = SubscriptionType.INDIVIDUAL_PREMIUM
                user.subscription_status = SubscriptionStatus.ACTIVE
            
            db.commit()
            print(f"[OK] Payment {checkout_request_id} COMPLETED. User {user.id if user else 'unknown'} upgraded to {payment.reference}.")
            
            # Send confirmation email
            if user and user.email:
                send_payment_confirmation_email(
                    user_email=user.email,
                    user_name=user.full_name,
                    plan=plan_type,
                    amount=payment.amount,
                    transaction_code=payment.transaction_code or "N/A"
                )
                
        elif result_code == '1032':
            # Cancelled by user
            payment.status = PaymentStatus.CANCELLED
            payment.result_desc = result_desc
            db.commit()
            print(f"[CANCELLED] Payment {checkout_request_id} CANCELLED by user.")
            
        elif result_code == '1':
            # Still processing - keep as pending
            print(f"[PENDING] Payment {checkout_request_id} still processing...")
            
        elif result_code and result_code not in ['', '1']:
            # Other error codes = failed
            payment.status = PaymentStatus.FAILED
            payment.result_desc = result_desc
            db.commit()
            print(f"[FAILED] Payment {checkout_request_id} FAILED: {result_desc}")
            
    except Exception as e:
        print(f"[ERROR] Error querying M-Pesa status: {str(e)}")
        # Don't fail the request, just return current status
        
    return PaymentStatusResponse(
        status=payment.status,
        transaction_code=payment.transaction_code,
        amount=payment.amount,
        date=payment.updated_at
    )

@router.get("/history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's payment history"""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return [
        {
            "id": p.id,
            "amount": p.amount,
            "status": p.status.value,
            "plan": p.reference,
            "transaction_code": p.transaction_code,
            "phone_number": p.phone_number[-4:].rjust(len(p.phone_number), '*') if p.phone_number else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "description": p.description
        }
        for p in payments
    ]

@router.post("/downgrade")
async def downgrade_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Downgrade to Free Plan"""
    current_user.subscription_type = SubscriptionType.FREE
    current_user.subscription_status = SubscriptionStatus.ACTIVE
    db.commit()
    return {"status": "success", "message": "Subscription downgraded to Free"}
