from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from notebook.models.detects import DBDetect
from notebook.models import models
from notebook.deps import get_session

router = APIRouter(prefix="/detects", tags=["detects"])

@router.post("/create")
async def create_detect(
    detect: DBDetect,  # ใช้ DBDetect แทน Detect เพื่อบันทึกข้อมูลลงฐานข้อมูล
    session: AsyncSession = Depends(get_session)
) -> DBDetect:
    # ตรวจสอบว่า DeviceID ซ้ำหรือไม่
    result = await session.exec(select(DBDetect).where(DBDetect.DeviceID == detect.DeviceID))
    existing_device = result.one_or_none()

    if existing_device:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="DeviceID already exists."
        )

    # บันทึกข้อมูลเข้า database
    session.add(detect)
    await session.commit()
    await session.refresh(detect)

    return detect


