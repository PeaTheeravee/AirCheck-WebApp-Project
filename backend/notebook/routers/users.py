from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.users import *
from notebook.deps import *
from notebook.models import get_session

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/create")
async def create(
    user_create: CreatedUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_superuser)],
) -> UserRead:

    # ตรวจสอบว่ามี username ซ้ำหรือไม่
    username_check = await session.exec(select(DBUser).where(DBUser.username == user_create.username))
    if username_check.one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with the same username already exists.",
        )

    # ตรวจสอบว่ามี first_name ซ้ำหรือไม่
    first_name_check = await session.exec(select(DBUser).where(DBUser.first_name == user_create.first_name))
    if first_name_check.one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with the same first_name already exists.",
        )

    # ตรวจสอบว่ามี last_name ซ้ำหรือไม่
    last_name_check = await session.exec(select(DBUser).where(DBUser.last_name == user_create.last_name))
    if last_name_check.one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with the same last_name already exists.",
        )

    # ตรวจสอบรหัสผ่านต้องไม่น้อยกว่า 8 
    if len(user_create.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    
    # สร้างผู้ใช้ใหม่โดยตั้ง role เป็น "admin"
    user = DBUser(
        username=user_create.username,
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        password=user_create.password,
    )
    await user.set_password(user_create.password)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return UserRead.model_validate(user)


@router.delete("/{target_user_id}")
async def delete_user(
    target_user_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_superuser)],
):
    user = await session.get(DBUser, target_user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.role == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete SuperAdmin account.",
        )

    await session.delete(user)
    await session.commit()

    return {"message": "User deleted successfully"}


@router.get("/all")
async def get_all_users(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_superuser)], 
    page: int = 1,  # หน้าปัจจุบัน (default = 1)
    size: int = 8,  # จำนวนรายการต่อหน้า (default = 8)
) -> UserList:

    # Query จำนวนรายการทั้งหมด
    total_users_query = await session.exec(select(DBUser))
    total_users = len(total_users_query.all())  # จำนวนทั้งหมด

    # คำนวณ offset และ limit สำหรับ pagination
    offset = (page - 1) * size

    # Query รายการของผู้ใช้และเรียงตาม ID จากเก่าไปใหม่
    result = await session.exec(
        select(DBUser).order_by(DBUser.id.asc()).offset(offset).limit(size)
    )
    users = result.all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found.")

    # คำนวณจำนวนหน้าทั้งหมด
    total_pages = (total_users + size - 1) // size

    # สร้าง Response พร้อมข้อมูล Pagination
    return UserList(
        users=[UserRead.model_validate(user) for user in users],
        total=total_users,
        page=page,
        size=size,
        total_pages=total_pages,
    )


@router.get("/me")
def get_me(
    current_user: UserRead = Depends(get_current_active_user)  
) -> UserRead:
    return current_user


@router.get("/{user_id}")
async def get(
    target_user_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_user)], 
) -> UserRead:

    user = await session.get(DBUser, target_user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found this user",
        )

    return user


# สำหรับการเปลี่ยนรหัสผ่านของตัวเอง
@router.put("/change_password")
async def change_password(
    password_update: ChangedPassword,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_user)],
) -> dict:

    # ตรวจสอบว่ารหัสผ่านใหม่เหมือนกับรหัสผ่านเดิมไหม
    if password_update.current_password == password_update.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The new password must not be the same as the current password.",
        )

    # ตรวจสอบรหัสผ่านเดิม
    if not await current_user.verify_password(password_update.current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password.",
        )

    # ตรวจสอบรหัสผ่านต้องไม่น้อยกว่า 8 ตัวอักษร
    if len(password_update.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    
    # ตั้งค่ารหัสผ่านใหม่
    await current_user.set_password(password_update.new_password)

    # ตั้ง user.status เป็น "inactive" ของตัวเอง
    current_user.status = "inactive"
    session.add(current_user)
    await session.commit()

    return {"message": "Password updated successfully. Please login again."}


# สำหรับการเปลี่ยนรหัสผ่านของคนอื่น (โดย superadmin)
@router.put("/{target_user_id}/change_password")
async def change_password_for_others(
    target_user_id: int,
    password_update: ChangedPasswordOther,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_superuser)],
) -> dict:

    # ตรวจสอบว่ารหัสผ่านใหม่และยืนยันรหัสผ่านตรงกันหรือไม่
    if password_update.new_password != password_update.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match.",
        )
    
    # ตรวจสอบว่ารหัสผ่านต้องไม่น้อยกว่า 8 ตัวอักษร
    if len(password_update.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )
    
    # ดึงข้อมูลผู้ใช้ที่ต้องการเปลี่ยนรหัสผ่าน
    user = await session.get(DBUser, target_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # ตั้งค่ารหัสผ่านใหม่ของคนที่ superadmin ไปเปลี่ยนรหัส
    await user.set_password(password_update.new_password)

    # ตั้ง user.status เป็น "inactive" ของคนที่ superadmin ไปเปลี่ยนรหัส
    user.status = "inactive"
    session.add(user)
    await session.commit()

    return {"message": "Password updated successfully for the target user. They must login again."}


@router.put("/{target_user_id}/update")
async def update(
    target_user_id: int,
    user_update: UpdatedUser,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_superuser)], 
) -> UserRead:
    
    # ดึงข้อมูลผู้ใช้ที่ต้องการอัปเดต
    db_user = await session.get(DBUser, target_user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found this user",
        )

    # จะไม่มีการ check การซ้ำกับบัญชีของ target_user_id (บัญชีที่เราจะไปกระทำ)
    # ตรวจสอบว่าข้อมูล username ซ้ำหรือไม่
    if user_update.username:
        result = await session.exec(select(DBUser).where(DBUser.username == user_update.username, DBUser.id != target_user_id))
        if result.one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with the same username already exists.",
            )

    # ตรวจสอบว่าข้อมูล first_name ซ้ำหรือไม่
    if user_update.first_name:
        result = await session.exec(select(DBUser).where(DBUser.first_name == user_update.first_name, DBUser.id != target_user_id))
        if result.one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with the same first_name already exists.",
            )

    # ตรวจสอบว่าข้อมูล last_name ซ้ำหรือไม่
    if user_update.last_name:
        result = await session.exec(select(DBUser).where(DBUser.last_name == user_update.last_name, DBUser.id != target_user_id))
        if result.one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with the same last_name already exists.",
            )

    # อัปเดตข้อมูลที่ส่งมา 
    user_data = user_update.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)

    return UserRead.model_validate(db_user)