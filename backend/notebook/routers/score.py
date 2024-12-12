from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models import get_session
from notebook.models.score import DBScore

router = APIRouter(prefix="/scores", tags=["scores"])


@router.get("/all")
async def get_all_scores(
    session: AsyncSession = Depends(get_session),
):
    # ดึงข้อมูลจากตาราง Score
    scores = await session.exec(select(DBScore))
    return scores.all()

