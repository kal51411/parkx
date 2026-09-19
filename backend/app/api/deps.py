from typing import Annotated
from uuid import UUID
from fastapi import Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.security import verify_token
from app.core.exceptions import AuthError, ForbiddenError
from app.models.user import User, UserRole
from app.services.auth_service import AuthService

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = verify_token(credentials.credentials, token_type="access")
    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Invalid token payload")
    user = await AuthService.get_user_by_id(db, UUID(user_id))
    if not user.is_active:
        raise AuthError("Account is deactivated")
    return user


def require_roles(*roles: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise ForbiddenError(
                f"This action requires one of: {', '.join(r.value for r in roles)}"
            )
        return current_user
    return role_checker


# Typed dependency aliases
CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]
Redis = Annotated[aioredis.Redis, Depends(get_redis)]

DriverOnly = Annotated[User, Depends(require_roles(UserRole.DRIVER))]
OwnerOnly = Annotated[User, Depends(require_roles(UserRole.PARKING_OWNER, UserRole.SOCIETY_ADMIN, UserRole.PLATFORM_ADMIN))]
SecurityOnly = Annotated[User, Depends(require_roles(UserRole.SECURITY, UserRole.PLATFORM_ADMIN))]
SocietyAdminOnly = Annotated[User, Depends(require_roles(UserRole.SOCIETY_ADMIN, UserRole.PLATFORM_ADMIN))]
AdminOnly = Annotated[User, Depends(require_roles(UserRole.PLATFORM_ADMIN))]
