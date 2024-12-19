from typing import Annotated

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook import deps
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
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
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
    current_user: Annotated[User, Depends(deps.get_current_active_user)],
) -> list[Device]:

    result = await session.exec(select(DBDevice))
    dbdevices = result.all()

    if not dbdevices:
        raise HTTPException(status_code=404, detail="No devices found.")

    return [Device.from_orm(dev) for dev in dbdevices]


@router.get("/{api_key}")
async def read_device_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(deps.get_current_active_user)],
) -> Device:

    result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    dbdevice = result.one_or_none()

    if not dbdevice:
        raise HTTPException(status_code=404, detail=f"No device found for API Key: {api_key}.")

    return Device.from_orm(dbdevice)


@router.put("/update/{api_key}")
async def update_device_by_api_key(
    api_key: str,
    device: UpdatedDevice,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
) -> Device:
    result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    dbdevice = result.one_or_none()

    if not dbdevice:
        raise HTTPException(status_code=404, detail="Device not found.")

    # อัปเดตเฉพาะ device_name และ location
    dbdevice.device_name = device.device_name
    dbdevice.location = device.location

    session.add(dbdevice)
    await session.commit()
    await session.refresh(dbdevice)

    return Device.from_orm(dbdevice)


@router.delete("/delete/{api_key}")
async def delete_device_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    dbdevice = result.one_or_none()

    if not dbdevice:
        raise HTTPException(status_code=404, detail="Device not found.")

    try:
        await session.delete(dbdevice)
        await session.commit()
        return {"message": "Device deleted successfully."}
    except IntegrityError as e:
        await session.rollback()
        return {"message": f"Failed to delete device due to integrity error: {str(e)}"}
