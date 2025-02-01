from fastapi import APIRouter, Depends, HTTPException, status, Form, Response, Request
from sqlmodel import select
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.users import *
from notebook.models import get_session

router = APIRouter(tags=["authentication"])

@router.post("/login")
async def login(
    username: Annotated[str, Form()],
    password: Annotated[str, Form()],
    session: Annotated[AsyncSession, Depends(get_session)],
    response: Response  # เพิ่ม response เพื่อจัดการคุกกี้
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

    # เก็บ user_id ในคุกกี้
    response.set_cookie(key="user_id", value=str(user.id), httponly=True)
    #response.set_cookie(key="user_id", value=str(user.id), httponly=True, secure=False, samesite="Lax")
    #logger.info(f"Set cookie user_id: {user.id}")  # เพิ่ม Logging หลังตั้งคุกกี้

    return {"message": "Login successful.", "role": user.role}


@router.post("/logout")
async def logout(
    request: Request,  # ใช้ Request เพื่อดึงคุกกี้
    session: Annotated[AsyncSession, Depends(get_session)],
    response: Response  # เพิ่ม response เพื่อจัดการคุกกี้
):
    # ดึง user_id จากคุกกี้
    user_id_str = request.cookies.get("user_id")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not logged in.")
    
    # แปลง user_id ให้เป็น int
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID.")

    user = await session.get(DBUser, user_id)
    
    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user has not logged in yet.",
        )

    # ปรับ user.status เป็น "inactive"
    user.status = "inactive"
    session.add(user)
    await session.commit()

    # ลบคุกกี้ user_id
    response.delete_cookie("user_id")

    return {"message": "Successfully logged out."}