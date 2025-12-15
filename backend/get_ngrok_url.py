import requests
import time
import sys

def get_ngrok_url():
    for i in range(10):
        try:
            response = requests.get("http://localhost:4040/api/tunnels")
            if response.status_code == 200:
                data = response.json()
                public_url = data['tunnels'][0]['public_url']
                print(f"Ngrok URL: {public_url}")
                return public_url
        except Exception:
            pass
        time.sleep(1)
    print("Could not connect to ngrok API")
    return None

if __name__ == "__main__":
    get_ngrok_url()
