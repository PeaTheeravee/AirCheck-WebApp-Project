from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from typing import Annotated
from notebook.models.users import *
from .. import deps
from .. import models

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/create")
async def create(
    user_info: RegisteredUser,
    session: Annotated[AsyncSession, Depends(models.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)],
) -> User:
    
    # ตรวจสอบสถานะของผู้ใช้ก่อน
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="The user is not active.")
    
    # ป้องกันการสร้างบัญชี SuperAdmin
    if user_info.username.lower() == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create or modify SuperAdmin account.",
        )

    # ตรวจสอบว่ามี username ซ้ำหรือไม่
    username_check = await session.exec(select(DBUser).where(DBUser.username == user_info.username))
    if username_check.one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with the same username already exists.",
        )

    # ตรวจสอบว่ามี first_name ซ้ำหรือไม่
    first_name_check = await session.exec(select(DBUser).where(DBUser.first_name == user_info.first_name))
    if first_name_check.one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with the same first_name already exists.",
        )

    # ตรวจสอบว่ามี last_name ซ้ำหรือไม่
    last_name_check = await session.exec(select(DBUser).where(DBUser.last_name == user_info.last_name))
    if last_name_check.one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with the same last_name already exists.",
        )

    # สร้างผู้ใช้ใหม่โดยตั้ง role เป็น "admin"
    user = DBUser(
        username=user_info.username,
        first_name=user_info.first_name,
        last_name=user_info.last_name,
        password=user_info.password,
        role="admin",  # กำหนดบทบาทเป็น admin
    )
    await user.set_password(user_info.password)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return User.from_orm(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    session: Annotated[AsyncSession, Depends(models.get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_superuser)],
):
    
    # ตรวจสอบสถานะของผู้ใช้ก่อน
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="The user is not active.")
    
    user = await session.get(DBUser, user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.username.lower() == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete SuperAdmin account.",
        )

    await session.delete(user)
    await session.commit()

    return {"message": "User deleted successfully"}


@router.get("/me")
def get_me(
    current_user: User = Depends(deps.get_current_user)
) -> User:
    
    # ตรวจสอบสถานะของผู้ใช้ก่อน
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="The user is not active.")
    return current_user


@router.get("/{user_id}")
async def get(
    user_id: int,
    session: Annotated[AsyncSession, Depends(models.get_session)],
) -> User:

    user = await session.get(DBUser, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found this user",
        )

    return user


@router.put("/{user_id}/change_password")
async def change_password(
    user_id: int,
    password_update: ChangedPassword,
    session: Annotated[AsyncSession, Depends(models.get_session)],
    current_user: User = Depends(deps.get_current_user),
) -> dict:

    # ตรวจสอบสถานะของผู้ใช้ก่อน
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="The user is not active.")
    
    # ดึงข้อมูลผู้ใช้ที่ต้องการเปลี่ยนรหัสผ่าน
    user = await session.get(DBUser, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # กรณีที่ผู้ใช้เป็น admin: เปลี่ยนรหัสผ่านได้เฉพาะของตัวเอง
    if current_user.role == "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins can only change their own password.",
        )

    # กรณีที่ผู้ใช้เป็น superadmin: สามารถเปลี่ยนรหัสผ่านของ admin ได้
    if current_user.role == "superadmin" and user.role != "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SuperAdmins can only change passwords for themselves or Admins.",
        )

    # ตรวจสอบรหัสผ่านเดิม (เฉพาะถ้าเปลี่ยนรหัสผ่านตัวเอง)
    if current_user.id == user.id and not await user.verify_password(password_update.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password.",
        )

    # ตั้งค่ารหัสผ่านใหม่
    await user.set_password(password_update.new_password)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {"message": "Password updated successfully"}


@router.put("/{user_id}/update")
async def update(
    request: Request,
    user_id: int,
    session: Annotated[AsyncSession, Depends(models.get_session)],
    user_update: UpdatedUser,
    current_user: User = Depends(deps.get_current_active_superuser), # SuperAdmin เท่านั้น
) -> User:

    # ตรวจสอบสถานะของผู้ใช้ก่อน
    if current_user.status != "active":
        raise HTTPException(status_code=400, detail="The user is not active.")
    
    # ดึงข้อมูลผู้ใช้ที่ต้องการอัปเดต
    db_user = await session.get(DBUser, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found this user",
        )

    # ตรวจสอบว่าข้อมูล username ซ้ำหรือไม่
    if user_update.username:
        result = await session.exec(select(DBUser).where(DBUser.username == user_update.username, DBUser.id != user_id))
        if result.one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with the same username already exists.",
            )

    # ตรวจสอบว่าข้อมูล first_name ซ้ำหรือไม่
    if user_update.first_name:
        result = await session.exec(select(DBUser).where(DBUser.first_name == user_update.first_name, DBUser.id != user_id))
        if result.one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with the same first_name already exists.",
            )

    # ตรวจสอบว่าข้อมูล last_name ซ้ำหรือไม่
    if user_update.last_name:
        result = await session.exec(select(DBUser).where(DBUser.last_name == user_update.last_name, DBUser.id != user_id))
        if result.one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with the same last_name already exists.",
            )

    # อัปเดตข้อมูลที่ส่งมา
    user_data = user_update.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)

    return User.from_orm(db_user)