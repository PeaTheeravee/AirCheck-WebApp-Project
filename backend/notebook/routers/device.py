from typing import Annotated

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.detect import DBDetect
from notebook.models.score import DBScore
from notebook import deps
from notebook.models import get_session
from notebook.models.device import *
from notebook.models.users import *
from notebook.deps import *

import math

router = APIRouter(prefix="/devices", tags=["devices"])
router = APIRouter(prefix="/ws", tags=["websocket"])

# ตัวแปรเก็บ WebSocket และ API Key ของอุปกรณ์ที่เชื่อมต่อ
connected_devices = {}

SIZE_PER_PAGE = 50


@router.post("/create")
async def create_device(
    device: CreatedDevice,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
) -> Device | None:
    # ตรวจสอบว่า device_name มีอยู่แล้วในระบบหรือไม่
    existing_device = await session.exec(select(DBDevice).where(DBDevice.device_name == device.device_name))
    if existing_device.one_or_none():
        raise HTTPException(
            status_code=400, detail="There is already a device with the same name."
        )

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

    # ตรวจสอบว่า device_name มีอยู่แล้วในระบบหรือไม่ (ยกเว้นอุปกรณ์ตัวเอง)
    existing_device = await session.exec(
        select(DBDevice).where(DBDevice.device_name == device.device_name, DBDevice.id != dbdevice.id)
    )
    if existing_device.one_or_none():
        raise HTTPException(
            status_code=400, detail="There is already a device with the same name."
        )

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

    # ตรวจสอบความสัมพันธ์กับตาราง score และ detect
    score_check = await session.exec(select(DBScore).where(DBScore.api_key == api_key))
    if score_check.first():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this device because it is referenced in the scores table."
        )

    detect_check = await session.exec(select(DBDetect).where(DBDetect.api_key == api_key))
    if detect_check.first():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this device because it is referenced in the detects table."
        )

    # ลบข้อมูล
    await session.delete(dbdevice)
    await session.commit()

    return {"message": "Device deleted successfully."}


@router.websocket("/devices/{api_key}")
async def websocket_devices(websocket: WebSocket, api_key: str):

    await websocket.accept()
    try:
        # บันทึกการเชื่อมต่อ
        connected_devices[websocket] = api_key
        print(f"Device connected: {api_key}")

        # รอจนกว่าจะมีการตัดการเชื่อมต่อ
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        # ลบ WebSocket ออกจากตัวแปรและแสดงข้อความ
        if websocket in connected_devices:
            disconnected_api_key = connected_devices.pop(websocket)
            print(f"Device disconnected: {disconnected_api_key}")
 
