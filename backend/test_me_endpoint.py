import requests
from auth import create_access_token
from config import settings

def test_me():
    email = "kevadihxidic2015@gmail.com"
    token = create_access_token(data={"sub": email})
    
    url = f"http://localhost:8000/api/v1/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
        else:
            print("Success!")
            print(response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_me()
