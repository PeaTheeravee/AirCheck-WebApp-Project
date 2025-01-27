from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel


class BaseScore(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    api_key: str  # ใช้ API Key อ้างอิงอุปกรณ์
    timestamp: Optional[datetime]  # เวลาที่ตรวจวัด
    pm2_5_quality_level: str  # ระดับคุณภาพอากาศสำหรับ PM2.5
    pm2_5_fix: str  # คำแนะนำสำหรับ PM2.5
    pm10_quality_level: str  # ระดับคุณภาพอากาศสำหรับ PM10
    pm10_fix: str  # คำแนะนำสำหรับ PM10
    co2_quality_level: str  # ระดับคุณภาพอากาศสำหรับ CO2
    co2_fix: str  # คำแนะนำสำหรับ CO2
    tvoc_quality_level: str  # ระดับคุณภาพอากาศ สารอินทรีย์ระเหยรวม  
    tvoc_fix: str  # คำแนะนำสำหรับ สารอินทรีย์ระเหยรวม
    humidity_quality_level: str  # ระดับคุณภาพอากาศสำหรับ Humidity
    humidity_fix: str  # คำแนะนำสำหรับ Humidity
    temperature_quality_level: str  # ระดับคุณภาพอากาศสำหรับ Temperature
    temperature_fix: str  # คำแนะนำสำหรับ Temperature


class Score(BaseScore):
    id: int


class DBScore(SQLModel, table=True):
    __tablename__ = "scores"
    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(index=True)  
    timestamp: Optional[datetime]  
    pm2_5_quality_level: str  
    pm2_5_fix: str  
    pm10_quality_level: str  
    pm10_fix: str  
    co2_quality_level: str  
    co2_fix: str  
    tvoc_quality_level: str  
    tvoc_fix: str  
    humidity_quality_level: str  
    humidity_fix: str  
    temperature_quality_level: str  
    temperature_fix: str  

class ScoreList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    scores: list[Score]
    #ถ้าข้อมูลอาจมีจำนวนมากในอนาคต ควรเพิ่ม Pagination 
    #page: int
    #page_size: int
    #size_per_page: int