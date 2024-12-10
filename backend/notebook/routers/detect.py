from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
from notebook.models.device import DBDevice
from notebook.models import *
from notebook.models.detect import *
from notebook.deps import *

router = APIRouter(prefix="/detects", tags=["detects"])

SIZE_PER_PAGE = 50

@router.post("/create")
async def create_detect(
    detect: CreatedDetect,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Detect | None:

    # ตรวจสอบว่า device_id มีอยู่ในฐานข้อมูลหรือไม่
    device = await session.get(DBDevice, detect.device_id)
    if not device:
        raise HTTPException(status_code=400, detail=f"Device with id {detect.device_id} does not exist. Please add devices first.")

    # หากพบ device_id ในระบบ ให้สร้าง detect ใหม่
    data = detect.dict()

    dbdata = DBDetect(**data)
    session.add(dbdata)
    await session.commit()
    await session.refresh(dbdata)

    return Detect.from_orm(dbdata)