from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_database
from app.auth import verify_password, create_access_token, get_current_user, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    db = get_database()
    user = await db["users"].find_one({"email": req.email.strip().lower()})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "buyer_id": user.get("buyer_id"),
        "unit_id": user.get("unit_id")
    })
    
    return LoginResponse(
        access_token=token,
        user=UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            role=user["role"],
            buyer_id=user.get("buyer_id"),
            unit_id=user.get("unit_id"),
            language_preference=user.get("language_preference", "en")
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.get("/demo-users")
async def get_demo_users():
    """Returns demo reviewer credentials for easy testing."""
    return [
        {
            "role": "merchandiser",
            "email": "merchandiser@company-a.com",
            "password": "admin123",
            "name": "Karthik Subramanian (Lead Merchandiser)",
            "description": "Full access to Order Board, PO Setup, Delay Warnings & AI Triage"
        },
        {
            "role": "supervisor",
            "email": "supervisor@company-a.com",
            "password": "admin123",
            "name": "Muthu Vel (Floor Supervisor)",
            "description": "Tamil mobile interface for entering daily numbers, photos & Tamil notes"
        },
        {
            "role": "buyer",
            "email": "buyer.uk@company-b.co.uk",
            "password": "admin123",
            "name": "Sarah Jenkins (Company B - UK)",
            "description": "Read-only UK Buyer view (isolated strictly to Company B orders)"
        },
        {
            "role": "buyer",
            "email": "buyer.de@company-c.de",
            "password": "admin123",
            "name": "Hans Müller (Company C - Germany)",
            "description": "Read-only German Buyer view (isolated strictly to Company C orders)"
        }
    ]

