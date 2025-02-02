from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field
from datetime import date


class DailyAverageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    avg_pm2_5: float
    avg_pm10: float
    avg_co2: float
    avg_tvoc: float
    avg_humidity: float
    avg_temperature: float

class DBDailyAverage(SQLModel, table=True):
    __tablename__ = "daily_averages"

    id: int = Field(primary_key=True)
    api_key: str = Field(index=True)
    date: date

    avg_pm2_5: float
    avg_pm10: float
    avg_co2: float
    avg_tvoc: float
    avg_humidity: float
    avg_temperature: float
