from typing import Annotated

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends

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


#สำหรับดูปีเเละเดือน เพื่อใช้ประกอบการตัดสินใจ
@router.get("/timestamps/{api_key}")
async def get_timestamps_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
) -> list[str]:
    # ดึงข้อมูล timestamp ตาม API Key
    result = await session.exec(select(DBScore.timestamp).where(DBScore.api_key == api_key))
    timestamps = result.all()

    if not timestamps:
        raise HTTPException(status_code=404, detail="No timestamps found for the provided API Key.")

    # แปลงเป็นปีและเดือนเท่านั้น
    year_months = [ts.strftime("%Y-%m") for ts in timestamps if ts]

    # ลบข้อมูลที่ซ้ำกัน
    unique_year_months = sorted(set(year_months))

    return unique_year_months


@router.delete("/delete/{api_key}")
async def delete_device_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ตรวจสอบว่าอุปกรณ์มีอยู่หรือไม่
    result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    dbdevice = result.one_or_none()

    if not dbdevice:
        raise HTTPException(status_code=404, detail="Device not found.")

    # ลบข้อมูลในตาราง scores
    score_result = await session.exec(select(DBScore).where(DBScore.api_key == api_key))
    scores = score_result.all()
    for score in scores:
        await session.delete(score)

    # ลบข้อมูลในตาราง detects
    detect_result = await session.exec(select(DBDetect).where(DBDetect.api_key == api_key))
    detects = detect_result.all()
    for detect in detects:
        await session.delete(detect)

    # ลบอุปกรณ์
    await session.delete(dbdevice)
    await session.commit()

    return {"message": "The device and all associated data have been successfully erased"}


@router.delete("/delete_by_month/{api_key}")
async def delete_data_by_month(
    api_key: str,
    months_to_delete: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ดึงข้อมูล detect ตาม API Key และจัดเรียงตาม timestamp
    detect_result = await session.exec(
        select(DBDetect).where(DBDetect.api_key == api_key).order_by(DBDetect.timestamp.asc())
    )
    detects = detect_result.all()

    # ดึงข้อมูล score ตาม API Key และจัดเรียงตาม timestamp
    score_result = await session.exec(
        select(DBScore).where(DBScore.api_key == api_key).order_by(DBScore.timestamp.asc())
    )
    scores = score_result.all()

    if not detects and not scores:
        raise HTTPException(status_code=404, detail="No data found for the provided API Key.")

    # จัดกลุ่มข้อมูล detect ตามเดือน
    grouped_detects = {}
    for detect in detects:
        month_key = detect.timestamp.strftime("%Y-%m") if detect.timestamp else None
        if month_key not in grouped_detects:
            grouped_detects[month_key] = []
        grouped_detects[month_key].append(detect)

    # จัดกลุ่มข้อมูล score ตามเดือน
    grouped_scores = {}
    for score in scores:
        month_key = score.timestamp.strftime("%Y-%m") if score.timestamp else None
        if month_key not in grouped_scores:
            grouped_scores[month_key] = []
        grouped_scores[month_key].append(score)

    # ตรวจสอบว่ามีเดือนเพียงพอที่จะลบหรือไม่
    if len(grouped_detects) < months_to_delete and len(grouped_scores) < months_to_delete:
        raise HTTPException(
            status_code=400,
            detail="Not enough months of data to delete the specified number of months."
        )

    # ลบข้อมูลจากเดือนที่เก่าสุด
    months_deleted = 0
    for month in sorted(set(grouped_detects.keys()).union(grouped_scores.keys())):
        if month in grouped_detects:
            for detect in grouped_detects[month]:
                await session.delete(detect)
        if month in grouped_scores:
            for score in grouped_scores[month]:
                await session.delete(score)
        months_deleted += 1
        if months_deleted >= months_to_delete:
            break

    await session.commit()

    return {"message": f"Deleted {months_deleted} months of detection and score data successfully."}
