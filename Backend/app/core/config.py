"""
Application settings loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Central configuration for the Pedestal backend."""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""             # anon/public key (for client-side)
    supabase_service_key: str = ""     # service_role key (bypasses RLS, backend only)
    supabase_jwt_secret: str = ""

    # Google OAuth (legacy, optional)
    google_client_id: str = ""

    # Energy System Defaults
    default_max_energy: int = 100
    default_regen_rate: int = 5
    default_regen_interval_seconds: int = 1800  # 30 minutes

    # App
    app_env: str = "development"
    debug: bool = True

    # JWT
    jwt_algorithm: str = "HS256"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
