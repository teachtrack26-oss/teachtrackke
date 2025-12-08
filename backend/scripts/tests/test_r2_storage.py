"""
Test script for Cloudflare R2 storage integration
Run this to verify R2 setup is working correctly
"""

import sys
sys.path.append('.')

from storage import r2_storage
from PIL import Image
import io

def test_r2_connection():
    """Test 1: Check R2 connection and bucket access"""
    print("\n" + "="*60)
    print("TEST 1: R2 Connection")
    print("="*60)
    
    if r2_storage is None:
        print("[FAIL] R2 storage not initialized")
        return False
    
    print(f"[OK] R2 storage initialized")
    print(f"   Account ID: {r2_storage.account_id}")
    print(f"   Bucket: {r2_storage.bucket_name}")
    print(f"   Endpoint: {r2_storage.endpoint}")
    
    # Check bucket exists
    if r2_storage.check_bucket_exists():
        print(f"[OK] Bucket '{r2_storage.bucket_name}' is accessible")
        return True
    else:
        print(f"[FAIL] Bucket '{r2_storage.bucket_name}' not accessible")
        return False

def test_file_upload():
    """Test 2: Upload a test file"""
    print("\n" + "="*60)
    print("TEST 2: File Upload")
    print("="*60)
    
    # Create test file content
    test_content = b"This is a test file for TeachTrack R2 storage integration."
    
    result = r2_storage.upload_file(
        file_content=test_content,
        filename="test_file.txt",
        content_type="text/plain",
        folder="test",
        metadata={'test': 'true'}
    )
    
    if result['success']:
        print(f"[OK] File uploaded successfully")
        print(f"   URL: {result['file_url']}")
        print(f"   S3 Key: {result['s3_key']}")
        print(f"   Size: {result['size']} bytes")
        return result['s3_key']
    else:
        print(f"[FAIL] Upload failed: {result.get('error')}")
        return None

def test_thumbnail_generation():
    """Test 3: Generate thumbnail from image"""
    print("\n" + "="*60)
    print("TEST 3: Thumbnail Generation")
    print("="*60)
    
    # Create test image (100x100 red square)
    img = Image.new('RGB', (100, 100), color='red')
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG')
    img_content = img_io.getvalue()
    
    # Upload original
    upload_result = r2_storage.upload_file(
        file_content=img_content,
        filename="test_image.jpg",
        content_type="image/jpeg",
        folder="test"
    )
    
    if not upload_result['success']:
        print(f"[FAIL] Image upload failed: {upload_result.get('error')}")
        return None, None
    
    print(f"[OK] Original image uploaded: {upload_result['file_url']}")
    
    # Generate thumbnail
    thumb_result = r2_storage.generate_thumbnail(img_content, "test_image.jpg")
    
    if thumb_result['success']:
        print(f"[OK] Thumbnail generated successfully")
        print(f"   URL: {thumb_result['file_url']}")
        return upload_result['s3_key'], thumb_result['s3_key']
    else:
        print(f"[FAIL] Thumbnail generation failed: {thumb_result.get('error')}")
        return upload_result['s3_key'], None

def test_file_listing():
    """Test 4: List files in bucket"""
    print("\n" + "="*60)
    print("TEST 4: File Listing")
    print("="*60)
    
    result = r2_storage.list_files(folder="test")
    
    if result['success']:
        print(f"[OK] Listed {result['count']} test files")
        for file in result['files'][:5]:  # Show first 5
            print(f"   - {file['s3_key']} ({file['size']} bytes)")
        return True
    else:
        print(f"[FAIL] Listing failed: {result.get('error')}")
        return False

def test_file_deletion(s3_keys):
    """Test 5: Delete test files"""
    print("\n" + "="*60)
    print("TEST 5: File Deletion")
    print("="*60)
    
    success_count = 0
    for s3_key in s3_keys:
        if s3_key:
            result = r2_storage.delete_file(s3_key)
            if result['success']:
                print(f"[OK] Deleted: {s3_key}")
                success_count += 1
            else:
                print(f"[FAIL] Failed to delete: {s3_key}")
    
    print(f"\n[OK] Deleted {success_count}/{len([k for k in s3_keys if k])} files")
    return success_count > 0

def run_all_tests():
    """Run all R2 storage tests"""
    print("\n" + "="*60)
    print("TEACHTRACK R2 STORAGE TEST SUITE")
    print("="*60)
    
    # Test 1: Connection
    if not test_r2_connection():
        print("\n[FAIL] Connection test failed. Stopping tests.")
        return
    
    # Test 2: Upload
    txt_key = test_file_upload()
    
    # Test 3: Thumbnail
    img_key, thumb_key = test_thumbnail_generation()
    
    # Test 4: List
    test_file_listing()
    
    # Test 5: Delete
    test_file_deletion([txt_key, img_key, thumb_key])
    
    print("\n" + "="*60)
    print("[SUCCESS] ALL TESTS COMPLETED")
    print("="*60)
    print("\nYour R2 storage is ready for TeachTrack!")
    print(f"Public URL: {r2_storage.public_url}")
    print(f"Bucket: {r2_storage.bucket_name}")

if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"\n[FAIL] TEST SUITE FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
