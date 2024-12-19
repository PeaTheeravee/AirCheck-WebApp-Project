from typing_extensions import Annotated
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models import get_session
from notebook.models.score import *

router = APIRouter(prefix="/scores", tags=["scores"])


@router.get("/all")
async def get_all_scores(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[Score]:

    result = await session.exec(select(DBScore))
    scores = result.all()

    if not scores:
        raise HTTPException(status_code=404, detail="No score data found.")

    return [Score.from_orm(sco) for sco in scores]


@router.get("/{api_key}")
async def get_scores_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[Score]:

    result = await session.exec(select(DBScore).where(DBScore.api_key == api_key))
    score = result.all()

    if not score:
        raise HTTPException(status_code=404, detail=f"No score data found for API Key: {api_key}.")

    return [Score.from_orm(sco) for sco in score]