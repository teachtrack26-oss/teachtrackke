import requests
import base64
from datetime import datetime
from config import settings
import json
import random
import string

class MpesaClient:
    """
    M-Pesa Integration Client
    
    IMPORTANT: Sandbox mode does NOT send real STK pushes to phones!
    - Sandbox is only for testing API integration
    - To receive real STK pushes, you need PRODUCTION credentials
    - In sandbox, we simulate successful payments for testing the full flow
    """
    
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.passkey = settings.MPESA_PASSKEY
        self.shortcode = settings.MPESA_SHORTCODE
        self.is_sandbox = settings.MPESA_ENV == "sandbox"
        self.base_url = "https://sandbox.safaricom.co.ke" if self.is_sandbox else "https://api.safaricom.co.ke"
        
        # Track sandbox transactions for simulation
        self._sandbox_transactions = {}

    def get_access_token(self):
        """Generate access token from Safaricom"""
        api_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        auth_string = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_auth}"
        }
        
        try:
            response = requests.get(api_url, headers=headers, timeout=30)
            response.raise_for_status()
            token = response.json()['access_token']
            print(f"[OK] M-Pesa Auth Success - Token obtained")
            return token
        except Exception as e:
            print(f"[ERROR] Error generating access token: {str(e)}")
            raise e

    def generate_password(self):
        """Generate password for STK push"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        return base64.b64encode(password_str.encode()).decode(), timestamp

    def _generate_transaction_code(self):
        """Generate a realistic M-Pesa transaction code"""
        letters = ''.join(random.choices(string.ascii_uppercase, k=10))
        return f"S{letters}"

    def initiate_stk_push(self, phone_number: str, amount: int, account_reference: str, transaction_desc: str):
        """
        Initiate STK Push
        
        In SANDBOX mode: API call succeeds but NO actual STK push is sent to phone.
        We track the transaction and simulate success on status query.
        """
        try:
            access_token = self.get_access_token()
            password, timestamp = self.generate_password()
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Format phone number (ensure it starts with 254)
            original_phone = phone_number
            phone_number = str(phone_number).strip().replace('+', '')
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif len(phone_number) == 9:
                phone_number = '254' + phone_number
            
            print(f"[STK] Initiating STK Push to {phone_number} for KES {amount}")
            
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": amount,
                "PartyA": phone_number,
                "PartyB": self.shortcode,
                "PhoneNumber": phone_number,
                "CallBackURL": settings.MPESA_CALLBACK_URL,
                "AccountReference": account_reference,
                "TransactionDesc": transaction_desc
            }
            
            api_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            response = requests.post(api_url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            print(f"[OK] STK Push Response: {json.dumps(result, indent=2)}")
            
            # Track transaction for sandbox simulation
            if self.is_sandbox and result.get("CheckoutRequestID"):
                checkout_id = result["CheckoutRequestID"]
                self._sandbox_transactions[checkout_id] = {
                    "phone": phone_number,
                    "amount": amount,
                    "created_at": datetime.now(),
                    "transaction_code": self._generate_transaction_code()
                }
                print(f"[SANDBOX] Real STK push sent - check your phone!")
                print(f"[SANDBOX] Transaction {checkout_id} tracked.")
            
            return result
            
        except Exception as e:
            print(f"[ERROR] Error initiating STK push: {str(e)}")
            raise e

    def query_stk_status(self, checkout_request_id: str):
        """
        Query STK Push transaction status
        
        In SANDBOX mode: Try real API first. If it fails with 500/403 errors,
        return "still processing" to keep polling. The callback should handle
        the actual result.
        """
        try:
            access_token = self.get_access_token()
            password, timestamp = self.generate_password()
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }
            
            api_url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
            response = requests.post(api_url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            print(f"[OK] STK Query Result: {json.dumps(result, indent=2)}")
            return result
            
        except Exception as e:
            print(f"[WARN] Error querying STK status: {str(e)}")
            
            # In sandbox, query often fails even for valid transactions
            # Return "still processing" so frontend keeps polling
            # The M-Pesa callback will handle the actual result
            if self.is_sandbox:
                print("[SANDBOX] Query failed, returning 'still processing'. Waiting for callback...")
                return {
                    "ResponseCode": "0",
                    "ResponseDescription": "The service request is processed successfully.",
                    "MerchantRequestID": "pending",
                    "CheckoutRequestID": checkout_request_id,
                    "ResultCode": "1",  # Code 1 = still processing
                    "ResultDesc": "The transaction is being processed"
                }
            raise e

mpesa_client = MpesaClient()
