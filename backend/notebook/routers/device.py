from typing import Annotated

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.daily_average import DailyAverage
from notebook.models.showdetect import Show
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
    current_user: Annotated[UserRead, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
) -> DeviceRead | None:
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

    return DeviceRead.from_orm(dbdevice)


@router.get("/all")
async def read_devices(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(deps.get_current_active_user)],
    page: int = 1,  # หน้าปัจจุบัน (default = 1)
    size: int = 5,  # จำนวนรายการต่อหน้า (default = 5)
) -> DeviceList:

    # Query จำนวนรายการทั้งหมด
    total_devices_query = await session.exec(select(DBDevice))
    total_devices = len(total_devices_query.all())  # จำนวนทั้งหมด

    # คำนวณ offset และ limit สำหรับ pagination
    offset = (page - 1) * size

    # Query รายการของผู้ใช้
    result = await session.exec(
        select(DBDevice).offset(offset).limit(size)
    )
    dbdevices = result.all()

    if not dbdevices:
        raise HTTPException(status_code=404, detail="No devices found.")
    
    # คำนวณจำนวนหน้าทั้งหมด
    total_pages = (total_devices + size - 1) // size

    # สร้าง Response พร้อมข้อมูล Pagination
    return DeviceList(
        devices=[DeviceRead.from_orm(dev) for dev in dbdevices],
        total=total_devices,
        page=page,
        size=size,
        total_pages=total_pages,
    )


@router.get("/{api_key}")
async def read_device_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(deps.get_current_active_user)],
) -> DeviceRead:

    result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    dbdevice = result.one_or_none()

    if not dbdevice:
        raise HTTPException(status_code=404, detail=f"No device found for API Key: {api_key}.")

    return DeviceRead.from_orm(dbdevice)


@router.put("/update/{api_key}")
async def update_device_by_api_key(
    api_key: str,
    device: UpdatedDevice,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
) -> DeviceRead:
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

    return DeviceRead.from_orm(dbdevice)


@router.put("/update_time/{api_key}")
async def update_device_time(
    api_key: str,
    device: DeviceTimeUpdate,  
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
) -> DeviceRead:
    result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    dbdevice = result.one_or_none()

    if not dbdevice:
        raise HTTPException(status_code=404, detail="Device not found.")

    dbdevice.device_settime = device.device_settime  # อัปเดตค่าเวลา
    
    session.add(dbdevice)
    await session.commit()
    await session.refresh(dbdevice)

    return DeviceRead.from_orm(dbdevice)


# สำหรับ ESP32
@router.get("/get_time/{api_key}")
async def get_device_settime(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    result = await session.exec(select(DBDevice.device_settime).where(DBDevice.api_key == api_key))
    device_settime = result.one_or_none()

    if device_settime is None:
        raise HTTPException(status_code=404, detail="Device not found.")

    return {"device_settime": device_settime}


# สำหรับดูปีเเละเดือน เพื่อใช้ประกอบการตัดสินใจ
@router.get("/timestamps/{api_key}")
async def get_timestamps_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
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
    current_user: Annotated[UserRead, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ตรวจสอบว่าอุปกรณ์มีอยู่หรือไม่
    result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
    dbdevice = result.one_or_none()

    if not dbdevice:
        raise HTTPException(status_code=404, detail="Device not found.")

    # ลบข้อมูลในตาราง showdetect
    showdetect_result = await session.exec(select(Show).where(Show.api_key == api_key))
    showdetects = showdetect_result.all()
    for show in showdetects:
        await session.delete(show)

    # ลบข้อมูลในตาราง daily_averages
    daily_avg_result = await session.exec(select(DailyAverage).where(DailyAverage.api_key == api_key))
    daily_averages = daily_avg_result.all()
    for daily_avg in daily_averages:
        await session.delete(daily_avg)

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
    current_user: Annotated[UserRead, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ดึงข้อมูล daily_average ตาม API Key และจัดเรียงตามวันที่
    daily_avg_result = await session.exec(
        select(DailyAverage).where(DailyAverage.api_key == api_key).order_by(DailyAverage.date.asc())
    )
    daily_averages = daily_avg_result.all()

    # ดึงข้อมูล detect ตาม API Key และจัดเรียงตาม timestamp
    detect_result = await session.exec(
        select(DBDetect).where(DBDetect.api_key == api_key).order_by(DBDetect.timestamp.asc())
    )
    detects = detect_result.all()

    if not daily_averages and not detects:
        raise HTTPException(status_code=404, detail="No daily average or detect data found for the provided API Key.")

    # จัดกลุ่มข้อมูล daily_average ตามเดือน
    grouped_daily_avg = {}
    for daily_avg in daily_averages:
        month_key = daily_avg.date.strftime("%Y-%m") if daily_avg.date else None
        if month_key not in grouped_daily_avg:
            grouped_daily_avg[month_key] = []
        grouped_daily_avg[month_key].append(daily_avg)

    # จัดกลุ่มข้อมูล detect ตามเดือน
    grouped_detects = {}
    for detect in detects:
        month_key = detect.timestamp.strftime("%Y-%m") if detect.timestamp else None
        if month_key not in grouped_detects:
            grouped_detects[month_key] = []
        grouped_detects[month_key].append(detect)

    # ตรวจสอบว่ามีเดือนเพียงพอที่จะลบหรือไม่
    available_months = sorted(set(grouped_daily_avg.keys()).union(grouped_detects.keys()))
    if len(available_months) < months_to_delete:
        raise HTTPException(
            status_code=400,
            detail="Not enough months of data to delete the specified number of months."
        )

    # ลบข้อมูลจากเดือนที่เก่าสุด
    months_deleted = 0
    for month in available_months:
        if month in grouped_daily_avg:
            for daily_avg in grouped_daily_avg[month]:
                await session.delete(daily_avg)

        if month in grouped_detects:
            for detect in grouped_detects[month]:
                await session.delete(detect)

        months_deleted += 1
        if months_deleted >= months_to_delete:
            break

    await session.commit()

    return {"message": f"Deleted {months_deleted} months of daily average and detect data successfully."}
