from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel


class BaseScore(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    api_key: str  # ใช้ API Key อ้างอิงอุปกรณ์
    device_name: str  # ชื่ออุปกรณ์ที่มาจากตาราง Device
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


class CreatedScore(BaseScore):
    pass


class UpdatedScore(BaseScore):
    pass


class Score(BaseScore):
    id: int


class DBScore(SQLModel, table=True):
    __tablename__ = "scores"
    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(index=True)  # อ้างอิง API Key ของอุปกรณ์
    device_name: str  # ชื่ออุปกรณ์
    timestamp: Optional[datetime]  # เวลาที่ตรวจวัด
    pm2_5_quality_level: str  # ระดับคุณภาพอากาศ PM2.5
    pm2_5_fix: str  # คำแนะนำสำหรับ PM2.5
    pm10_quality_level: str  # ระดับคุณภาพอากาศ PM10
    pm10_fix: str  # คำแนะนำสำหรับ PM10
    co2_quality_level: str  # ระดับคุณภาพอากาศ CO2
    co2_fix: str  # คำแนะนำสำหรับ CO2
    tvoc_quality_level: str  # ระดับคุณภาพอากาศ สารอินทรีย์ระเหยรวม  
    tvoc_fix: str  # คำแนะนำสำหรับ สารอินทรีย์ระเหยรวม
    humidity_quality_level: str  # ระดับคุณภาพอากาศ Humidity
    humidity_fix: str  # คำแนะนำสำหรับ Humidity
    temperature_quality_level: str  # ระดับคุณภาพอากาศ Temperature
    temperature_fix: str  # คำแนะนำสำหรับ Temperature

class ScoreList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    scores: list[Score]
    #ถ้าข้อมูลอาจมีจำนวนมากในอนาคต ควรเพิ่ม Pagination 
    #page: int
    #page_size: int
    #size_per_page: int