from fastapi import Depends, HTTPException, status
from typing import Annotated
from notebook.models.users import *
from . import models

# ฟังก์ชันนี้จะเช็คเฉพาะผู้ใช้ที่สถานะเป็น "active" เท่านั้น
async def get_current_active_user(
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
    user_id: int,
) -> User:
    # ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    user = await session.get(DBUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.status != "active":
        raise HTTPException(status_code=400, detail="User is not active.")
    return user

# ฟังก์ชันนี้จะเช็คเฉพาะ superadmin
async def get_current_active_superuser(
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
    user_id: int,
) -> User:
    # ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    user = await session.get(DBUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges.",
        )
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superuser is not active.",
        )
    return user