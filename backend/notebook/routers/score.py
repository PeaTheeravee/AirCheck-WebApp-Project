from typing_extensions import Annotated
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.deps import *
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


#สำหรับดูปีเเละเดือน เพื่อใช้ประกอบการตัดสินใจ สำหรับ /delete_by_month/{api_key} ของตารางdetect - ตารางscore
@router.get("/timestamps/{api_key}")
async def get_timestamps_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
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


#เมื่อต้องการลบข้อมูลอุปกรณ์
@router.delete("/delete/{api_key}")
async def delete_scores_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ดึงข้อมูล score ตาม API Key
    result = await session.exec(select(DBScore).where(DBScore.api_key == api_key))
    scores = result.all()

    if not scores:
        raise HTTPException(status_code=404, detail="No score data found for the provided API Key.")

    # ลบข้อมูลทั้งหมดที่เกี่ยวข้องกับ API Key
    for score in scores:
        await session.delete(score)

    await session.commit()

    return {"message": "All score data associated with the API Key has been deleted successfully."}


@router.delete("/delete_by_month/{api_key}")
async def delete_scores_by_month(
    api_key: str,
    months_to_delete: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ดึงข้อมูล score ตาม API Key และจัดเรียงข้อมูลตาม timestamp
    result = await session.exec(
        select(DBScore).where(DBScore.api_key == api_key).order_by(DBScore.timestamp.asc())
    )
    scores = result.all()

    if not scores:
        raise HTTPException(status_code=404, detail="No score data found for the provided API Key.")

    # จัดกลุ่มข้อมูลตามเดือน
    grouped_by_month = {}
    for score in scores:
        month_key = score.timestamp.strftime("%Y-%m") if score.timestamp else None
        if month_key not in grouped_by_month:
            grouped_by_month[month_key] = []
        grouped_by_month[month_key].append(score)

    # ตรวจสอบว่ามีเดือนเพียงพอที่จะลบหรือไม่
    if len(grouped_by_month) < months_to_delete:
        raise HTTPException(
            status_code=400,
            detail="Not enough months of score data to delete the specified number of months."
        )

    # ลบข้อมูลจากเดือนที่เก่าสุด
    months_deleted = 0
    for month in sorted(grouped_by_month.keys()):
        for score in grouped_by_month[month]:
            await session.delete(score)
        months_deleted += 1
        if months_deleted >= months_to_delete:
            break

    await session.commit()

    return {"message": f"Deleted {months_deleted} months of score data successfully."}
