from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.showdetect import *
from notebook.models import get_session

router = APIRouter(prefix="/showdetect", tags=["showdetect"])

@router.get("/{api_key}")
async def get_showdetect_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ShowRead:
    # ค้นหาข้อมูลล่าสุดสำหรับ api_key
    result = await session.exec(select(DBShow).where(DBShow.api_key == api_key))
    show = result.one_or_none()

    if not show:
        raise HTTPException(status_code=404, detail=f"No detect data found for API Key: {api_key}.")

    return ShowRead.model_validate(show)  
