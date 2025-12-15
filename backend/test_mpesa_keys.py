import requests
import base64
from config import settings

def test_auth():
    print("--- Testing M-Pesa Credentials ---")
    print(f"Consumer Key: {settings.MPESA_CONSUMER_KEY[:5]}...{settings.MPESA_CONSUMER_KEY[-5:]}")
    print(f"Consumer Secret: {settings.MPESA_CONSUMER_SECRET[:5]}...{settings.MPESA_CONSUMER_SECRET[-5:]}")
    print(f"Environment: {settings.MPESA_ENV}")
    
    base_url = "https://sandbox.safaricom.co.ke" if settings.MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke"
    api_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
    
    auth_string = f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}"
    encoded_auth = base64.b64encode(auth_string.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_auth}"
    }
    
    try:
        print(f"Connecting to {api_url}...")
        response = requests.get(api_url, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✅ SUCCESS! Credentials are valid.")
            print(f"Access Token: {response.json().get('access_token')[:10]}...")
        else:
            print("❌ FAILED! Credentials rejected by Safaricom.")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_auth()
