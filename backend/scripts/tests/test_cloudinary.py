"""
Quick Cloudinary credential test
Run this to verify your credentials before starting the main app
"""
import cloudinary
import cloudinary.api
from config import settings

# Clean and configure
cloud_name = (settings.CLOUDINARY_CLOUD_NAME or "").strip().strip('"').strip("'")
api_key = (settings.CLOUDINARY_API_KEY or "").strip().strip('"').strip("'")
api_secret = (settings.CLOUDINARY_API_SECRET or "").strip().strip('"').strip("'")

print("=" * 60)
print("CLOUDINARY CREDENTIAL TEST")
print("=" * 60)
print(f"Cloud Name: {cloud_name}")
print(f"API Key: {api_key[:4]}...{api_key[-4:] if len(api_key) > 8 else '(too short)'}")
print(f"API Key Length: {len(api_key)}")
print(f"API Secret: {'*' * len(api_secret)} (length: {len(api_secret)})")
print("=" * 60)

if not all([cloud_name, api_key, api_secret]):
    print("❌ ERROR: One or more credentials are empty!")
    print(f"   Cloud Name empty: {not cloud_name}")
    print(f"   API Key empty: {not api_key}")
    print(f"   API Secret empty: {not api_secret}")
    exit(1)

# Test configuration
try:
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    
    # Test with actual API call
    print("\nTesting connection to Cloudinary...")
    result = cloudinary.api.usage()
    
    print("✅ SUCCESS! Credentials are valid.")
    print(f"\nAccount Info:")
    print(f"  Cloud: {result.get('cloud_name', 'N/A')}")
    print(f"  Plan: {result.get('plan', 'N/A')}")
    print(f"  Bandwidth used: {result.get('bandwidth', {}).get('usage', 0)} / {result.get('bandwidth', {}).get('limit', 'N/A')}")
    print(f"  Storage used: {result.get('storage', {}).get('usage', 0)} bytes")
    print(f"  Resources: {result.get('resources', 0)}")
    print("\n✅ You can now start the application!")
    
except cloudinary.exceptions.AuthorizationRequired as e:
    print(f"\n❌ AUTHORIZATION ERROR: {e}")
    print("\nPossible issues:")
    print("  1. API Key is incorrect or doesn't match the Cloud Name")
    print("  2. API Secret is incorrect")
    print("  3. The credentials belong to different Cloudinary accounts")
    print("\n📋 To fix:")
    print("  1. Go to: https://console.cloudinary.com/settings/security")
    print("  2. Copy ALL THREE values from the SAME account:")
    print("     - Cloud name")
    print("     - API Key (numeric)")
    print("     - API Secret")
    print("  3. Update backend/.env with NO quotes:")
    print("     CLOUDINARY_CLOUD_NAME=your_cloud_name")
    print("     CLOUDINARY_API_KEY=123456789012345")
    print("     CLOUDINARY_API_SECRET=your_secret_here")
    exit(1)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"\nError type: {type(e).__name__}")
    exit(1)
