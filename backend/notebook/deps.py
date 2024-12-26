#import logging
#logger = logging.getLogger(__name__)
from fastapi import Depends, HTTPException, Request, status
from typing import Annotated
from notebook.models.users import *
from . import models

# ฟังก์ชันนี้จะเช็คเฉพาะผู้ใช้ที่สถานะเป็น "active" เท่านั้น
async def get_current_active_user(
    request: Request,  # เพิ่ม request เพื่อดึงคุกกี้
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
) -> User:
    # ดึง user_id จากคุกกี้
    user_id = request.cookies.get("user_id")
    #logger.info(f"Cookie user_id: {user_id}")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not logged in.")
    
    # ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    user = await session.get(DBUser, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.status != "active":
        raise HTTPException(status_code=400, detail="User is not active.")
    return user

# ฟังก์ชันนี้จะเช็คเฉพาะ superadmin
async def get_current_active_superuser(
    request: Request,  # เพิ่ม request เพื่อดึงคุกกี้
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
) -> User:
    # ดึง user_id จากคุกกี้
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not logged in.")
    
    # ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    user = await session.get(DBUser, int(user_id))
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