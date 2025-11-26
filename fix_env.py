import os

content = """NEXT_PUBLIC_GOOGLE_CLIENT_ID=1091679198456-kuap2p7jfcdskj1hle12jlqcfpjgmje9.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
"""

file_path = os.path.join("frontend", ".env.local")

with open(file_path, "w") as f:
    f.write(content)

print(f"Successfully wrote to {file_path}")
