"""
Supabase client singletons.

- get_supabase()         → anon/public key client (for user-facing queries)
- get_supabase_admin()   → service_role key client (bypasses RLS, backend-only)
"""

from supabase import create_client, Client
from app.core.config import get_settings


_supabase_client: Client | None = None
_supabase_admin_client: Client | None = None


def get_supabase() -> Client:
    """Returns a cached Supabase anon client instance."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_key,
        )
    return _supabase_client


def get_supabase_admin() -> Client:
    """
    Returns a cached Supabase service-role client.
    Use this for server-side operations that must bypass RLS
    (e.g. auto-creating user profiles on first login).
    NEVER expose this client or its key to the frontend.
    """
    global _supabase_admin_client
    if _supabase_admin_client is None:
        settings = get_settings()
        key = settings.supabase_service_key or settings.supabase_key
        _supabase_admin_client = create_client(
            settings.supabase_url,
            key,
        )
    return _supabase_admin_client
