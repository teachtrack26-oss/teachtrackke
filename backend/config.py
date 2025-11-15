from pydantic_settings import BaseSettings
from urllib.parse import quote_plus

class Settings(BaseSettings):
    # Database - Using URL encoding for special characters
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "2078@lk//K."
    DB_NAME: str = "teachtrack"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://192.168.0.102:3000"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.102:3000",
        "http://10.2.0.2:3000",
    ]
    
    # OpenRouter AI (for intelligent document parsing)
    OPENROUTER_API_KEY: str = ""  # Get free API key from https://openrouter.ai/keys
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-exp:free"  # Free vision model
    
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
    
    @property
    def DATABASE_URL(self) -> str:
        # URL encode the password to handle special characters
        encoded_password = quote_plus(self.DB_PASSWORD)
        return f"mysql+pymysql://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"

settings = Settings()
