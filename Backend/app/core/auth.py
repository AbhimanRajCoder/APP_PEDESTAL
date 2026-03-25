"""
JWT authentication dependency for FastAPI.
Decodes Supabase-issued JWTs from the Authorization header.
"""

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import get_settings

security = HTTPBearer()

# In-memory JWKS cache (keyed by kid) so we only fetch once per process.
_jwks_cache: dict[str, dict] = {}


def _fetch_jwks(supabase_url: str) -> dict[str, dict]:
    """
    Fetch JWKS from Supabase and return a dict keyed by kid.
    Uses httpx which correctly handles macOS SSL certificates.
    """
    url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            jwks = resp.json()
            keys = jwks.get("keys", [])
            return {k["kid"]: k for k in keys if "kid" in k}
    except Exception as e:
        print(f"❌ Failed to fetch JWKS from {url}: {e}")
        return {}


def _get_jwk_for_kid(supabase_url: str, kid: str) -> dict:
    """
    Return the JWK dict for the given kid, refreshing the cache if needed.
    """
    global _jwks_cache
    if kid not in _jwks_cache:
        _jwks_cache = _fetch_jwks(supabase_url)
    return _jwks_cache.get(kid, {})


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Decode the Supabase JWT and return the user's auth UID (sub claim).

    Raises 401 if the token is missing, expired, or invalid.
    """
    settings = get_settings()
    token = credentials.credentials

    # Inspect the unverified header to determine signing algorithm & key id.
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"🧐 Incoming JWT Header: {header}")

    alg = header.get("alg", "HS256")

    if alg == "HS256":
        key = settings.supabase_jwt_secret
    else:
        # ES256 (Supabase's asymmetric JWT): look up the correct JWK by kid.
        kid = header.get("kid", "")
        key = _get_jwk_for_kid(settings.supabase_url, kid)
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Unable to fetch public keys to verify this token. "
                    "Check SUPABASE_URL and network connectivity."
                ),
                headers={"WWW-Authenticate": "Bearer"},
            )

    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=["HS256", "ES256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject claim",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id

    except JWTError as e:
        print(f"🔓 JWT Decode Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
