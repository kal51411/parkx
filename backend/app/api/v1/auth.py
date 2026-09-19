from fastapi import APIRouter
from app.api.deps import DB
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse, LoginResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=LoginResponse, status_code=201)
async def register(data: RegisterRequest, db: DB):
    user, access_token, refresh_token = await AuthService.register(db, data)
    user_out = {
        "id": str(user.id),
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
    }
    return LoginResponse(access_token=access_token, refresh_token=refresh_token, user=user_out)


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: DB):
    user, access_token, refresh_token = await AuthService.login(db, data)
    user_out = {
        "id": str(user.id),
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
    }
    return LoginResponse(access_token=access_token, refresh_token=refresh_token, user=user_out)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: DB):
    access_token = await AuthService.refresh(db, data.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=data.refresh_token)
