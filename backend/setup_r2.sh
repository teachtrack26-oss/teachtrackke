#!/bin/bash

echo "=========================================="
echo "TeachTrack R2 Storage Setup"
echo "=========================================="
echo ""

# Check if in backend directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

echo "📦 Installing R2 storage dependencies..."
pip install boto3==1.34.23 python-magic python-magic-bin

echo ""
echo "✅ Dependencies installed"
echo ""

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ Warning: .env file not found"
fi

echo ""
echo "🔍 Checking R2 configuration..."
echo "   Account ID: ${R2_ACCOUNT_ID:0:10}..."
echo "   Bucket: $R2_BUCKET_NAME"
echo ""

echo "🧪 Running R2 connection test..."
python test_r2_storage.py

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If tests passed, you're ready to upload files!"
echo "2. Start the backend: python main.py"
echo "3. Use the FileUpload component in your frontend"
echo ""
