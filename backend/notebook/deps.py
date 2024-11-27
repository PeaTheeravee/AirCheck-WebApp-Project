from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

import typing
import jwt

from pydantic import ValidationError

from notebook.models.users import *

from . import models
from . import security
from . import config

# ตัวจัดการ token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")
settings = config.get_settings()

# Token blacklist (สำหรับ logout)
blacklist_tokens = set()


async def get_current_user(
    token: typing.Annotated[str, Depends(oauth2_scheme)],
    session: typing.Annotated[models.AsyncSession, Depends(models.get_session)],
) -> User:
    # ตรวจสอบ token ที่อาจถูก blacklist
    if token in blacklist_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        user_id: int = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except jwt.JWTError as e:
        print(e)
        raise credentials_exception

    user = await session.get(DBUser, user_id)
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: typing.Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_active_superuser(
    current_user: typing.Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user


class RoleChecker:
    def __init__(self, *allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        user: typing.Annotated[User, Depends(get_current_active_user)],
    ):
        if user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Role not permitted")
        return user


AdminRoleChecker = RoleChecker("admin", "superadmin")
