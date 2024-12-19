from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel

class BaseDetect(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    api_key: str  # ใช้ API Key แทน device_id
    pm2_5: float | None = 0  # เพิ่ม PM2.5
    pm10: float | None = 0  # เพิ่ม PM10
    co2: float | None = 0  # เพิ่ม CO2
    humidity: float | None = 0
    temperature: float | None = 0
    timestamp: Optional[datetime]


class CreatedDetect(BaseDetect):
    pass


class UpdatedDetect(BaseDetect):
    pass


class Detect(BaseDetect):
    id: int


class DBDetect(SQLModel, table=True):
    __tablename__ = "detects"
    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(default=None, index=True)  # ใช้ API Key สำหรับเชื่อมโยงกับอุปกรณ์
    pm2_5: float | None = 0  # เพิ่ม PM2.5
    pm10: float | None = 0  # เพิ่ม PM10
    co2: float | None = 0  # เพิ่ม CO2
    humidity: float | None = 0
    temperature: float | None = 0
    timestamp: Optional[datetime]


class DetectList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    detects: list[Detect]
    #ถ้าข้อมูลอาจมีจำนวนมากในอนาคต ควรเพิ่ม Pagination 
    #page: int
    #page_size: int
    #size_per_page: int