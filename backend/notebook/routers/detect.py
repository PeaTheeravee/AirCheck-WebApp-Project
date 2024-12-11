from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from notebook.models import get_session
from notebook.models.device import DBDevice
from notebook.models.detect import *
from notebook.deps import *

router = APIRouter(prefix="/detects", tags=["detects"])

SIZE_PER_PAGE = 50

@router.post("/create")
async def create_detect(
    detect: CreatedDetect,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Detect | None:

    # ตรวจสอบว่า API Key มีอยู่ในฐานข้อมูลหรือไม่
    device = await session.exec(select(DBDevice).where(DBDevice.api_key == detect.api_key))
    device = device.one_or_none()
    if not device:
        raise HTTPException(status_code=400, detail="Invalid API Key. Please add devices first.")

    # หากพบ API Key ในระบบ ให้สร้าง detect ใหม่
    dbdata = DBDetect(**detect.dict())  # ใช้ข้อมูลที่มี API Key โดยตรง

    session.add(dbdata)
    await session.commit()
    await session.refresh(dbdata)

    return Detect.from_orm(dbdata)