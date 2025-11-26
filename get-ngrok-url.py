"""
Get Ngrok Public URL
This script fetches and displays the current ngrok tunnel URL
"""

import requests
import time
import sys

def get_ngrok_url(max_retries=5):
    """Fetch the ngrok public URL"""
    print("\n" + "="*60)
    print("  Fetching Ngrok URL...")
    print("="*60 + "\n")
    
    for attempt in range(max_retries):
        try:
            # Query ngrok API
            response = requests.get('http://127.0.0.1:4040/api/tunnels', timeout=2)
            data = response.json()
            
            if data.get('tunnels') and len(data['tunnels']) > 0:
                tunnel = data['tunnels'][0]
                public_url = tunnel.get('public_url', '')
                
                # Display the URL
                print("\n" + "="*60)
                print("  ✅ YOUR NGROK URL IS READY!")
                print("="*60)
                print(f"\n  📱 URL: {public_url}\n")
                print("="*60)
                print("\n📌 Instructions:")
                print("   1. Open this URL on your smartphone browser")
                print("   2. Click 'Visit Site' on the ngrok warning page")
                print("   3. Login with your TeachTrack credentials")
                print("\n💡 Tip: You can also visit http://127.0.0.1:4040")
                print("   in your PC browser to see the ngrok dashboard\n")
                print("="*60 + "\n")
                
                return public_url
            else:
                print(f"⏳ Attempt {attempt + 1}/{max_retries}: Ngrok not ready yet...")
                time.sleep(2)
                
        except requests.exceptions.ConnectionError:
            if attempt == 0:
                print("❌ Cannot connect to ngrok!")
                print("\n📋 Make sure ngrok is running:")
                print("   Run: C:\\Users\\MKT\\Desktop\\ngrok.exe http 3000\n")
            time.sleep(2)
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(2)
    
    print("\n❌ Could not fetch ngrok URL after multiple attempts.")
    print("   Please check if ngrok is running correctly.\n")
    return None

if __name__ == "__main__":
    url = get_ngrok_url()
    if not url:
        sys.exit(1)
