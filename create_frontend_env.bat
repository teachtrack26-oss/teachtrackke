@echo off
echo Creating frontend/.env.local...
echo NEXT_PUBLIC_GOOGLE_CLIENT_ID=1091679198456-kuap2p7jfcdskj1hle12jlqcfpjgmje9.apps.googleusercontent.com > frontend\.env.local
echo NEXT_PUBLIC_API_URL=http://localhost:8000 >> frontend\.env.local
echo NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true >> frontend\.env.local
echo Done!
pause
