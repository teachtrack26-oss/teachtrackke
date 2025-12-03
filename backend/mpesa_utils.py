import requests
import base64
from datetime import datetime
from config import settings
import json

class MpesaClient:
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.passkey = settings.MPESA_PASSKEY
        self.shortcode = settings.MPESA_SHORTCODE
        self.base_url = "https://sandbox.safaricom.co.ke" if settings.MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke"

    def get_access_token(self):
        """Generate access token"""
        api_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        auth_string = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_auth}"
        }
        
        try:
            response = requests.get(api_url, headers=headers)
            response.raise_for_status()
            return response.json()['access_token']
        except Exception as e:
            print(f"Error generating access token: {str(e)}")
            raise e

    def generate_password(self):
        """Generate password for STK push"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        return base64.b64encode(password_str.encode()).decode(), timestamp

    def initiate_stk_push(self, phone_number: str, amount: int, account_reference: str, transaction_desc: str):
        """Initiate STK Push"""
        try:
            access_token = self.get_access_token()
            password, timestamp = self.generate_password()
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            # Format phone number (ensure it starts with 254)
            phone_number = str(phone_number).strip().replace('+', '')
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif len(phone_number) == 9:
                phone_number = '254' + phone_number
            
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
            response = requests.post(api_url, json=payload, headers=headers)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            print(f"Error initiating STK push: {str(e)}")
            raise e

    def query_stk_status(self, checkout_request_id: str):
        """Query STK Push transaction status - use this instead of callback"""
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
            response = requests.post(api_url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            print(f"STK Query Result: {json.dumps(result, indent=2)}")
            return result
            
        except Exception as e:
            print(f"Error querying STK status: {str(e)}")
            raise e

mpesa_client = MpesaClient()
