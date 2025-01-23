from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel

class BaseDetect(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    api_key: str  # ใช้ API Key แทน device_id
    pm2_5: float | None = 0  
    pm10: float | None = 0  
    co2: float | None = 0  
    tvoc: float | None = 0  
    humidity: float | None = 0
    temperature: float | None = 0
    timestamp: Optional[datetime]

class Detect(BaseDetect):
    id: int


class CreatedDetect(BaseDetect):
    api_key: str  
    pm2_5: float | None = 0  
    pm10: float | None = 0  
    co2: float | None = 0  
    tvoc: float | None = 0  
    humidity: float | None = 0
    temperature: float | None = 0
    timestamp: Optional[datetime]


class DBDetect(SQLModel, table=True):
    __tablename__ = "detects"
    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(default=None, index=True)  # ใช้ API Key สำหรับเชื่อมโยงกับอุปกรณ์
    pm2_5: float | None = 0  
    pm10: float | None = 0  
    co2: float | None = 0  
    tvoc: float | None = 0  
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