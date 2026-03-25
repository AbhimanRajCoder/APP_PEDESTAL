"""
Authentication Routes
=====================
Handles signup, login, and current user retrieval via Supabase Auth.
Google OAuth is handled client-side via the Supabase JS SDK;
the backend simply verifies the JWT via get_current_user.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from app.core.auth import get_current_user
from app.core.database import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


# ------------------------------------------------------------------
# Request / Response Schemas
# ------------------------------------------------------------------

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@router.post("/signup", response_model=TokenResponse)
async def signup(payload: SignUpRequest):
    """Register a new user with email and password."""
    sb = get_supabase()
    try:
        result = sb.auth.sign_up({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup failed: {e}",
        )

    if hasattr(result, "error") and result.error:
        err_msg = str(result.error)
        if "User already registered" in err_msg or "duplicate key" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists. Please log in instead.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg,
        )

    session = getattr(result, "session", None)
    if session and hasattr(session, "access_token"):
        return TokenResponse(access_token=session.access_token)

    raise HTTPException(
        status_code=status.HTTP_202_ACCEPTED,
        detail="Signup successful – please verify your email before logging in.",
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: SignInRequest):
    """Authenticate an existing user with email and password."""
    sb = get_supabase()
    try:
        result = sb.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {e}",
        )

    if hasattr(result, "error") and result.error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(result.error),
        )

    session = getattr(result, "session", None)
    if not session or not hasattr(session, "access_token"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login succeeded but no session was returned.",
        )
    # Enforce email verification
    user = getattr(session, "user", None)
    if user and getattr(user, "email_confirmed_at", None) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in.",
        )
    return TokenResponse(access_token=session.access_token)


@router.get("/me")
async def read_current_user(user_id: str = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    sb = get_supabase()
    response = sb.table("user_profiles").select("*").eq("id", user_id).single().execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )
    return response.data
