from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List
from notebook.models import get_session
from notebook.models.showdetect import Show

router = APIRouter(prefix="/showdetect", tags=["showdetect"])

@router.get("/{api_key}")
async def get_showdetect_by_api_key(
    api_key: str,
    session: AsyncSession = Depends(get_session),
) -> Show:
    # ค้นหาข้อมูลล่าสุดสำหรับ api_key
    result = await session.exec(select(Show).where(Show.api_key == api_key))
    show = result.one_or_none()

    if not show:
        raise HTTPException(status_code=404, detail="No data found for the given API Key.")

    return show
