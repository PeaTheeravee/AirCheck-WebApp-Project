from tkinter.tix import Form
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from typing import Annotated

from notebook.models.users import *
from .. import models

router = APIRouter(tags=["authentication"])


@router.post("/token")
async def login(
    username: Annotated[str, Form()],  # ใช้ Form สำหรับ username
    password: Annotated[str, Form()],  # ใช้ Form สำหรับ password
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
) -> dict:
    # ตรวจสอบ username และ password
    result = await session.exec(select(DBUser).where(DBUser.username == username))
    user = result.one_or_none()

    if not user or not await user.verify_password(password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    # ปรับ user.status เป็น "active"
    user.status = "active"
    session.add(user)
    await session.commit()

    return {"message": "Login successful.", "role": user.role}


@router.post("/logout")
async def logout(
    user_id: int,
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
):
    # ดึงข้อมูลผู้ใช้
    user = await session.get(DBUser, user_id)

    # ตรวจสอบสถานะผู้ใช้
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user has not logged in yet.",
        )

    # ปรับ user.status เป็น "inactive"
    user.status = "inactive"
    session.add(user)
    await session.commit()

    return {"message": "Successfully logged out."}