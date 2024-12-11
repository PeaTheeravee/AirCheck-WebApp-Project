from typing import Annotated

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models import get_session
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


@router.get("/api-key/{api_key}")
async def get_device_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Device:
    device = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    device = device.one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found.")
    return Device.from_orm(device)


@router.put("/update/{api_key}")
async def update_device_by_api_key(
    api_key: str,
    device: UpdatedDevice,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Device:
    device_in_db = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    device_in_db = device_in_db.one_or_none()

    if not device_in_db:
        raise HTTPException(status_code=404, detail="Device not found.")

    data = device.dict()
    for key, value in data.items():
        setattr(device_in_db, key, value)

    session.add(device_in_db)
    await session.commit()
    await session.refresh(device_in_db)

    return Device.from_orm(device_in_db)


@router.delete("/delete/{api_key}")
async def delete_device_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    device = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    device = device.one_or_none()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found.")

    try:
        await session.delete(device)
        await session.commit()
        return {"message": "Device deleted successfully."}
    except IntegrityError as e:
        await session.rollback()
        return {"message": f"Failed to delete device due to integrity error: {str(e)}"}
