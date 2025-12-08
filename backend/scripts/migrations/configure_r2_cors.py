"""
Configure CORS for Cloudflare R2 bucket to allow frontend access
"""
import boto3
from config import settings

def configure_r2_cors():
    """Set up CORS rules for R2 bucket"""
    
    # Create S3 client for R2
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name='auto'
    )
    
    # CORS configuration
    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
                'AllowedOrigins': [
                    'http://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://192.168.0.102:3000',
                    'http://10.2.0.2:3000',
                    '*'  # Allow all origins (you can restrict this later)
                ],
                'ExposeHeaders': ['ETag', 'Content-Length', 'Content-Type'],
                'MaxAgeSeconds': 3600
            }
        ]
    }
    
    try:
        # Apply CORS configuration
        s3_client.put_bucket_cors(
            Bucket=settings.R2_BUCKET_NAME,
            CORSConfiguration=cors_configuration
        )
        print(f"✅ CORS configured successfully for bucket: {settings.R2_BUCKET_NAME}")
        
        # Verify CORS configuration
        cors = s3_client.get_bucket_cors(Bucket=settings.R2_BUCKET_NAME)
        print(f"✅ Current CORS rules: {cors['CORSRules']}")
        
    except Exception as e:
        print(f"❌ Error configuring CORS: {str(e)}")
        print("\nNote: You can also configure CORS via Cloudflare R2 dashboard:")
        print("1. Go to https://dash.cloudflare.com/")
        print("2. Select R2 -> teachtrack-files")
        print("3. Settings -> CORS Policy")
        print("4. Add the following CORS policy:")
        print("""
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
        """)

if __name__ == "__main__":
    configure_r2_cors()
