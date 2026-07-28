import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "")
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")
    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", "common")
    AZURE_REDIRECT_URI: str = os.getenv("AZURE_REDIRECT_URI", "http://localhost:8000/api/auth/callback")
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    TOKEN_ENCRYPTION_KEY: str = os.getenv("TOKEN_ENCRYPTION_KEY", "")
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()