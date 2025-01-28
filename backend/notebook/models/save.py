from datetime import datetime
from sqlmodel import SQLModel, Field


class Save(SQLModel, table=True):
    __tablename__ = "saves"

    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(index=True)  # ใช้ API Key อ้างอิงอุปกรณ์
    pm2_5: float | None = 0
    pm10: float | None = 0
    co2: float | None = 0
    tvoc: float | None = 0
    humidity: float | None = 0
    temperature: float | None = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
