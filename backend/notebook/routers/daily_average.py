from typing_extensions import Annotated
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.deps import *
from notebook.models import get_session
from notebook.models.daily_average import *

router = APIRouter(prefix="/avg", tags=["avg"])

@router.get("/daily_averages/{api_key}")
async def get_daily_averages(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[dict]:
    result = await session.exec(
        select(DailyAverage).where(DailyAverage.api_key == api_key)
    )
    daily_averages = result.all()

    if not daily_averages:
        raise HTTPException(status_code=404, detail="No daily averages found.")

    # จัดข้อมูลในรูปแบบที่เหมาะกับ Recharts (รูปเเบบ Line Chart)
    return [
        {
            "date": daily_avg.date.strftime("%Y-%m-%d"),
            "avg_pm2_5": daily_avg.avg_pm2_5,
            "avg_pm10": daily_avg.avg_pm10,
            "avg_co2": daily_avg.avg_co2,
            "avg_tvoc": daily_avg.avg_tvoc,
            "avg_humidity": daily_avg.avg_humidity,
            "avg_temperature": daily_avg.avg_temperature,
        }
        for daily_avg in daily_averages
    ]
