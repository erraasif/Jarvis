import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "")
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")
    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", "common")
    # Accept both AZURE_REDIRECT_URI (correct name, used in code) and AZURE_REDIRECT_URL
    # (the name that ended up in .env by mistake) so a naming typo on the host doesn't
    # silently fall back to localhost.
    AZURE_REDIRECT_URI: str = os.getenv("AZURE_REDIRECT_URI") or os.getenv("AZURE_REDIRECT_URL", "http://localhost:8000/api/auth/callback")

    # The deployed frontend origin (Vercel URL). Used for CORS and for redirecting
    # back to the UI after the OAuth callback finishes.
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    TOKEN_ENCRYPTION_KEY: str = os.getenv("TOKEN_ENCRYPTION_KEY", "")
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()