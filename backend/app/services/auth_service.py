from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.vehicle import Vehicle
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, verify_token
from app.core.exceptions import AuthError, NotFoundError, ForbiddenError, ValidationError
from app.schemas.auth import RegisterRequest, LoginRequest


class AuthService:

    @staticmethod
    async def register(db: AsyncSession, data: RegisterRequest) -> tuple[User, str, str]:
        # Check email uniqueness
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise ValidationError("Email already registered", {"field": "email"})

        user = User(
            email=data.email,
            phone=data.phone,
            full_name=data.full_name,
            password_hash=hash_password(data.password),
            role=data.role,
        )
        db.add(user)
        await db.flush()  # Get the ID without committing

        token_data = {"sub": str(user.id), "role": user.role.value}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        return user, access_token, refresh_token

    @staticmethod
    async def login(db: AsyncSession, data: LoginRequest) -> tuple[User, str, str]:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(data.password, user.password_hash):
            raise AuthError("Invalid email or password")

        if not user.is_active:
            raise AuthError("Account is deactivated")

        token_data = {"sub": str(user.id), "role": user.role.value}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        return user, access_token, refresh_token

    @staticmethod
    async def refresh(db: AsyncSession, refresh_token: str) -> str:
        payload = verify_token(refresh_token, token_type="refresh")
        user_id = payload.get("sub")
        if not user_id:
            raise AuthError("Invalid refresh token")

        result = await db.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise AuthError("User not found or inactive")

        token_data = {"sub": str(user.id), "role": user.role.value}
        return create_access_token(token_data)

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User")
        return user
