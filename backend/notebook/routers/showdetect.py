from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.showdetect import *
from notebook.models import get_session

router = APIRouter(prefix="/showdetect", tags=["showdetect"])

@router.get("/all")
async def get_all_showdetects(
    session: Annotated[AsyncSession, Depends(get_session)],
    page: int = 1,  # หน้าปัจจุบัน (default = 1)
    size: int = 8,  # จำนวนรายการต่อหน้า (default = 8)
) -> ShowList:

    # Query จำนวนรายการทั้งหมด
    total_showdetects_query = await session.exec(select(DBShow))
    total_showdetects = len(total_showdetects_query.all())  # จำนวนทั้งหมด

    # คำนวณ offset และ limit สำหรับ pagination
    offset = (page - 1) * size

    # Query รายการ showdetect และเรียงลำดับตาม ID จากเก่าไปใหม่
    result = await session.exec(
        select(DBShow).order_by(DBShow.id.asc()).offset(offset).limit(size)
    )
    showdetects = result.all()

    if not showdetects:
        raise HTTPException(status_code=404, detail="No showdetect data found.")

    # คำนวณจำนวนหน้าทั้งหมด
    total_pages = (total_showdetects + size - 1) // size

    # สร้าง Response พร้อมข้อมูล Pagination
    return ShowList(
        shows=[ShowRead.model_validate(show) for show in showdetects],
        total=total_showdetects,
        page=page,
        size=size,
        total_pages=total_pages,
    )
