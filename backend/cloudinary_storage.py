import cloudinary
import cloudinary.uploader
import cloudinary.api
import cloudinary.utils
import os
from config import settings

# ============================================================================
# CLOUDINARY CONFIGURATION
# ============================================================================

def configure_cloudinary():
    """
    Configures Cloudinary using credentials from environment variables.
    """
    # Prefer single Cloudinary URL if provided
    cloudinary_url = (getattr(settings, 'CLOUDINARY_URL', '') or "").strip().strip('"').strip("'")

    # Read and sanitize discrete credentials
    cloud_name = (settings.CLOUDINARY_CLOUD_NAME or "").strip().strip('"').strip("'")
    api_key = (settings.CLOUDINARY_API_KEY or "").strip().strip('"').strip("'")
    api_secret = (settings.CLOUDINARY_API_SECRET or "").strip().strip('"').strip("'")

    if cloudinary_url:
        cloudinary.config(
            cloudinary_url=cloudinary_url,
            secure=True
        )
    else:
        if not all([cloud_name, api_key, api_secret]):
            print("Cloudinary credentials are not fully set. Uploads will be disabled.")
            return None
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )

    # Validate credentials with a light admin API call
    try:
        # A tiny call to verify auth; will raise on bad credentials
        cloudinary.api.usage()
        # Print minimal non-sensitive info for debugging
        cfg = cloudinary.config()
        key_len = len(str(cfg.api_key)) if cfg.api_key else 0
        print(f"Cloudinary configured successfully. cloud_name={cfg.cloud_name}, api_key_len={key_len}")
        return True
    except Exception as e:
        print(f"Cloudinary configuration invalid: {e}")
        return False

# Call configuration
IS_CONFIGURED = configure_cloudinary()

# ============================================================================
# FILE UPLOAD
# ============================================================================

def upload_file(file_content, public_id: str, folder: str = "notes"):
    """
    Uploads a file to Cloudinary.
    
    Args:
        file_content: The file content in bytes.
        public_id: The desired public_id for the file in Cloudinary.
        folder: The folder in Cloudinary to upload to.

    Returns:
        A dictionary containing the upload result from Cloudinary.
    """
    if not IS_CONFIGURED:
        raise ConnectionError("Cloudinary is not configured.")

    # Determine resource type based on file extension
    file_extension = public_id.split('.')[-1].lower()
    resource_type = "auto"
    if file_extension in ['pdf', 'docx', 'pptx', 'xlsx']:
        resource_type = "raw"
    elif file_extension in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        resource_type = "image"
    elif file_extension in ['mp4', 'mov', 'avi', 'mkv']:
        resource_type = "video"

    upload_options = {
        "public_id": public_id,
        "folder": folder,
        "resource_type": resource_type,
        "overwrite": True,
    }

    result = cloudinary.uploader.upload(
        file_content,
        **upload_options
    )
    return result

# ============================================================================
# THUMBNAIL GENERATION
# ============================================================================

def get_thumbnail_url(public_id: str, file_type: str):
    """
    Generates a thumbnail URL for a given public_id.
    Cloudinary automatically creates thumbnails on-the-fly via URL transformations.
    
    Args:
        public_id: The public_id of the file in Cloudinary.
        file_type: The type of the file (e.g., 'pdf', 'pptx').

    Returns:
        A string containing the transformed URL for the thumbnail.
    """
    if not IS_CONFIGURED:
        return None

    options = {
        "width": 400,
        "height": 400,
        "crop": "limit",
        "secure": True
    }

    # For PDFs, we need to specify the page number
    if file_type == 'pdf':
        options["page"] = 1
        
    # For other document types, Cloudinary will generate a default image
    if file_type in ['docx', 'pptx', 'xlsx']:
        # The format needs to be changed to an image format like jpg
        return cloudinary.utils.cloudinary_url(public_id, resource_type="raw", format="jpg", **options)[0]

    # For images and videos, it's more direct
    return cloudinary.utils.cloudinary_url(public_id, **options)[0]


# ============================================================================
# FILE DELETION
# ============================================================================

def delete_file(public_id: str, resource_type: str = "auto"):
    """
    Deletes a file from Cloudinary using its public_id.
    
    Args:
        public_id: The public_id of the file to delete.
        resource_type: The resource type ('image', 'video', 'raw'). 'auto' will try to guess.
    """
    if not IS_CONFIGURED:
        raise ConnectionError("Cloudinary is not configured.")
        
    # For raw files, we must specify the resource type
    if resource_type not in ["image", "video", "raw"]:
        # A simple guess, this might need to be more robust
        if '.' in public_id:
            ext = public_id.split('.')[-1].lower()
            if ext in ['pdf', 'docx', 'pptx', 'xlsx']:
                resource_type = "raw"
            else:
                resource_type = "image" # Default guess
        else:
            resource_type = "image"


    cloudinary.uploader.destroy(public_id, resource_type=resource_type)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def extract_public_id_from_url(url: str) -> str:
    """
    Extract the Cloudinary public_id from a delivery URL.

    Works for image/video/raw URLs, strips the version segment (v123456),
    removes the file extension from the last segment, and URL-decodes any
    percent-encoding (e.g., spaces).

    Example:
      https://res.cloudinary.com/<cloud>/raw/upload/v12345/notes/3/file name.pdf
      -> notes/3/file name
    """
    if not url or 'cloudinary.com' not in url:
        return None

    try:
        # Normalize to the part after '/upload/' (covers image/video/raw since raw has '/raw/upload/')
        if '/upload/' not in url:
            return None
        path_part = url.split('/upload/', 1)[1]

        # Drop query or fragment if present
        path_part = path_part.split('?', 1)[0].split('#', 1)[0]

        # Split into path segments
        segments = path_part.split('/')

        # Strip leading version segment like 'v1763132195'
        if segments and segments[0].startswith('v') and segments[0][1:].isdigit():
            segments = segments[1:]

        if not segments:
            return None

        # Remove extension only from the last segment
        last = segments[-1]
        if '.' in last:
            last = last.rsplit('.', 1)[0]
        segments[-1] = last

        # URL-decode percent-encoding
        from urllib.parse import unquote
        public_id = unquote('/'.join(segments))

        return public_id or None
    except Exception:
        return None

