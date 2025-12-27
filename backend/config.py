from pydantic import model_validator
from pydantic_settings import BaseSettings
from urllib.parse import quote_plus

class Settings(BaseSettings):
    # Database - Using URL encoding for special characters
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "2078@lk//K."
    DB_NAME: str = "teachtrack"
    # Optional full DB URL override (preferred in Docker)
    DATABASE_URL: str = ""
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "https://teachtrackke.vercel.app"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://teachtrackke.vercel.app",  # Vercel production
        "https://teachtrackke.duckdns.org",  # VPS domain
    ]
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://rubeolar-jaxon-unintuitively.ngrok-free.dev/api/auth/callback/google"
    
    # Email Configuration
    RESEND_API_KEY: str = ""  # Get from https://resend.com/api-keys

    # Legacy SMTP (Gmail)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "teachtrack26@gmail.com"
    SMTP_PASSWORD: str = ""  # App password from Gmail
    
    # Sender Identity
    # Note: For Resend testing, use 'onboarding@resend.dev' if you haven't verified a domain.
    FROM_EMAIL: str = "onboarding@resend.dev" 
    FROM_NAME: str = "TeachTrack"
    
    # Email Verification
    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    
    # OpenRouter AI (for intelligent document parsing)
    OPENROUTER_API_KEY: str = ""  # Get free API key from https://openrouter.ai/keys
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-exp:free"  # Free vision model
    
    # M-Pesa Configuration (Your Sandbox Credentials)
    MPESA_CONSUMER_KEY: str = "0jKMlR2RRKSBzyOmCAG2cKCAk6oKGTHr5PHUGFcIGOMaRNVv"
    MPESA_CONSUMER_SECRET: str = "8Rz3KdxtByCKPqdbzyVZ27NAKDBkSGA9u8yYbeTWN9nx0HTYQXqvTNw0U6ImpUo2"
    MPESA_PASSKEY: str = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    MPESA_SHORTCODE: str = "174379"
    MPESA_CALLBACK_URL: str = "https://rubeolar-jaxon-unintuitively.ngrok-free.dev/api/v1/payments/callback"
    MPESA_ENV: str = "sandbox"

    # Cloudinary Storage
    # You can set either the three fields below OR a single CLOUDINARY_URL.
    CLOUDINARY_URL: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: str = "pdf,docx,doc,pptx,ppt,xlsx,xls,txt,jpg,jpeg,png,gif,bmp,svg,mp4,mov,avi,mkv,webm"
    
    @property
    def MAX_FILE_SIZE_BYTES(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024
    
    @property
    def ALLOWED_FILE_TYPES_LIST(self) -> list:
        return [ext.strip() for ext in self.ALLOWED_FILE_TYPES.split(",")]
    
    @model_validator(mode="after")
    def _set_database_url_if_missing(self):
        if not self.DATABASE_URL:
            encoded_password = quote_plus(self.DB_PASSWORD)
            self.DATABASE_URL = (
                f"mysql+pymysql://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )

        # Normalize common env vars that are frequently pasted with trailing newlines/spaces.
        if isinstance(self.GOOGLE_CLIENT_ID, str):
            self.GOOGLE_CLIENT_ID = self.GOOGLE_CLIENT_ID.strip()
        if isinstance(self.GOOGLE_CLIENT_SECRET, str):
            self.GOOGLE_CLIENT_SECRET = self.GOOGLE_CLIENT_SECRET.strip()

        return self
    
    class Config:
        env_file = ".env"

settings = Settings()
