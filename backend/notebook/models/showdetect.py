from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field
from datetime import datetime


class ShowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    api_key: str  
    timestamp: datetime
    pm2_5: float
    pm10: float
    co2: float
    tvoc: float
    humidity: float
    temperature: float


class DBShow(SQLModel, table=True):
    __tablename__ = "showdetects"

    id: int = Field(primary_key=True)
    api_key: str = Field(index=True)  
    timestamp: datetime

    pm2_5: float
    pm10: float
    co2: float
    tvoc: float
    humidity: float
    temperature: float


class ShowList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    shows: list[ShowRead]
    total: int  # จำนวนผู้ใช้ทั้งหมด
    page: int  # หน้าปัจจุบัน
    size: int  # จำนวนผู้ใช้ต่อหน้า
    total_pages: int  # จำนวนหน้าทั้งหมด