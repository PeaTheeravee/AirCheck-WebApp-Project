from typing import Annotated

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models import *
from notebook.models.device import *

from notebook.models.users import *

from notebook.deps import *

import math

router = APIRouter(prefix="/devices", tags=["devices"])

SIZE_PER_PAGE = 50


@router.post("/create")
async def create_device(
    device: CreatedDevice,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],  # ระบุผู้ใช้ที่เพิ่มอุปกรณ์
) -> Device | None:

    # ตรวจสอบว่า device_id ซ้ำหรือไม่
    existing_device = await session.exec(select(DBDevice).where(DBDevice.device_id == device.device_id))
    if existing_device.one_or_none():
        raise HTTPException(status_code=400, detail="This device_id already exists.")

    # เพิ่มข้อมูลผู้ใช้ในอุปกรณ์
    data = device.dict()
    data['user_id'] = current_user.id

    dbdevice = DBDevice(**data)
    session.add(dbdevice)
    await session.commit()
    await session.refresh(dbdevice)

    return Device.from_orm(dbdevice)


@router.get("/all")
async def read_devices(
    session: Annotated[AsyncSession, Depends(get_session)],
    page: int = 1,
) -> DeviceList:

    result = await session.exec(select(DBDevice).offset((page - 1) * SIZE_PER_PAGE).limit(SIZE_PER_PAGE))
    devices = result.all()

    page_count = int(
        math.ceil(
            (await session.exec(select(func.count(DBDevice.id)))).first()
            / SIZE_PER_PAGE
        )
    )

    return DeviceList.from_orm(
        dict(devices=devices, page_count=page_count, page=page, size_per_page=SIZE_PER_PAGE)
    )


@router.get("/{device_id}")
async def read_device(
    device_id: int, session: Annotated[AsyncSession, Depends(get_session)]
) -> Device:

    db_device = await session.get(DBDevice, device_id)
    if db_device:
        return Device.from_orm(db_device)

    raise HTTPException(status_code=404, detail="Item not found")


@router.put("/{device_id}/update")
async def update_device(
    device_id: int,
    device: UpdatedDevice,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Device:

    data = device.dict()

    db_device = await session.get(DBDevice, device_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found.")

    for key, value in data.items():
        setattr(db_device, key, value)

    session.add(db_device)
    await session.commit()
    await session.refresh(db_device)

    return Device.from_orm(db_device)


@router.delete("/{device_id}/delete")
async def delete_device(
    device_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    try:
        # ลบข้อมูลในตาราง devices
        db_device = await session.get(DBDevice, device_id)
        if db_device:
            await session.delete(db_device)
            await session.commit()

            return dict(message="delete success")
        else:
            return dict(message="device not found")

    except IntegrityError as e:
        await session.rollback()
        return dict(message=f"Failed to delete due to integrity error: {str(e)}")