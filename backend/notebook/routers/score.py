from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.score import *
from notebook.deps import *
from notebook.models import get_session

router = APIRouter(prefix="/scores", tags=["scores"])

@router.get("/{api_key}")
async def get_scores_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ScoreRead:  

    # ค้นหาข้อมูลล่าสุดสำหรับ api_key
    result = await session.exec(select(DBScore).where(DBScore.api_key == api_key))
    score = result.one_or_none()  

    if not score:
        raise HTTPException(status_code=404, detail=f"No score data found for API Key: {api_key}.")

    return ScoreRead.model_validate(score)
