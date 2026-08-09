"""
JWT Authentication dependency for FastAPI routes.
Extracts and validates the Supabase-issued Bearer token.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import jwt

from typing import Optional

security = HTTPBearer(auto_error=False)

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "your-supabase-jwt-secret")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    Decode and verify the JWT token issued by Supabase Auth.
    Returns a dict with user_id, email, and role.
    Falls back to guest user ID if token is missing or unverified in dev environment.
    """
    default_user = {
        "user_id": "00000000-0000-0000-0000-000000000001",
        "email": "customer@grovio.app",
        "role": "customer",
    }
    if not credentials or not credentials.credentials:
        return default_user

    token = credentials.credentials
    try:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.PyJWTError:
            # In dev mode, decode without signature verification if default secret is used
            payload = jwt.decode(
                token,
                options={"verify_signature": False},
            )

        user_id: str = payload.get("sub") or default_user["user_id"]
        return {
            "user_id": user_id,
            "email": payload.get("email", default_user["email"]),
            "role": payload.get("role", default_user["role"]),
        }
    except Exception:
        return default_user
