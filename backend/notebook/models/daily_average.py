from datetime import date
from sqlmodel import SQLModel, Field

class DailyAverage(SQLModel, table=True):
    __tablename__ = "daily_averages"

    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(index=True)
    date: date  # วันที่
    avg_pm2_5: float
    avg_pm10: float
    avg_co2: float
    avg_tvoc: float
    avg_humidity: float
    avg_temperature: float
