from typing import Annotated

from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends, Query

from sqlmodel import Session, select, func
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
    current_user: Annotated[User, Depends(AdminRoleChecker)],  # Admin หรือ SuperAdmin เท่านั้น
) -> Device | None:

    data = device.dict()

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

    print("page_count", page_count)
    print("devices", devices)

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
    db_device.sqlmodel_update(data)
    
    session.add(db_device)
    await session.commit()
    await session.refresh(db_device)

    return device.from_orm(db_device)


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