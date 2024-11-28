from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from typing import Annotated
import datetime
import jwt

from notebook.models.users import *
from .. import config, models, security

router = APIRouter(tags=["authentication"])

settings = config.get_settings()
blacklist_tokens = set()  # เก็บ token ที่ logout แล้ว


@router.post("/token")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
) -> Token:
    result = await session.exec(select(DBUser).where(DBUser.username == form_data.username))
    user = result.one_or_none()

    if not user:
        result = await session.exec(select(DBUser).where(DBUser.email == form_data.username))
        user = result.one_or_none()

    if not user or not await user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    access_token_expires = datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = datetime.timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

    # อัปเดต status เป็น 'active'
    user.status = "active"
    session.add(user)
    await session.commit()
    
    return Token(
        access_token=security.create_access_token(
            data={"sub": user.id}, expires_delta=access_token_expires
        ),
        refresh_token=security.create_refresh_token(
            data={"sub": user.id}, expires_delta=refresh_token_expires
        ),
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        expires_at=datetime.datetime.now() + access_token_expires,
        issued_at=datetime.datetime.now(),
        scope=user.role,  # ใช้ role เป็น scope
    )


@router.post("/logout")
async def logout(
    token: Annotated[str, Depends(security.oauth2_scheme)],
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
):
    if token in blacklist_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token already invalidated.")
    blacklist_tokens.add(token)

    # ดึงข้อมูลผู้ใช้จาก token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: int = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    
    # เปลี่ยน status ของผู้ใช้เป็น inactive
    user = await session.get(DBUser, user_id)
    if user:
        user.status = "inactive"
        session.add(user)
        await session.commit()

    return {"message": "Successfully logged out."}


@router.post("/refresh")
async def refresh_token(
    token: Annotated[str, Depends(security.oauth2_scheme)],
    session: Annotated[models.AsyncSession, Depends(models.get_session)],
):
    # ตรวจสอบการ decode token ว่าถูกต้องหรือไม่
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: int = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    # ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    user = await session.get(DBUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    
    # ตรวจสอบสถานะของผู้ใช้ ต้องเป็น "active" เท่านั้น
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User is not active. Please login again."
        )

    # ตรวจสอบว่า token ถูกใส่ใน blacklist หรือไม่
    if token in blacklist_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid.")

    # กำหนดเวลาให้ token ใหม่
    access_token_expires = datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # สร้าง access token ใหม่
    new_access_token = security.create_access_token({"sub": user.id}, expires_delta=access_token_expires)

    # คืนค่า access token ใหม่
    return {"access_token": new_access_token, "token_type": "bearer"}
