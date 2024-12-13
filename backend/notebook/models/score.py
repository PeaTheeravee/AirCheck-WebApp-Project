from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel


class BaseScore(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    api_key: str  # ใช้ API Key อ้างอิงอุปกรณ์
    device_name: str  # ชื่ออุปกรณ์ที่มาจากตาราง Device
    humidity: float  # ข้อมูลความชื้นจาก Detect
    temperature: float  # ข้อมูลอุณหภูมิจาก Detect
    timestamp: Optional[datetime]  # เวลาที่ตรวจวัด
    humidity_IAQI: float  # คะแนน IAQI ที่คำนวณจาก Humidity
    temperature_IAQI: float  # คะแนน IAQI ที่คำนวณจาก Temperature
    humidity_quality_level: str  # ระดับคุณภาพอากาศสำหรับ Humidity
    temperature_quality_level: str  # ระดับคุณภาพอากาศสำหรับ Temperature


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
    humidity: float  # ความชื้นจาก Detect
    temperature: float  # อุณหภูมิจาก Detect
    timestamp: Optional[datetime]  # เวลาที่ตรวจวัด
    humidity_IAQI: float  # คะแนน IAQI ที่คำนวณจาก Humidity
    temperature_IAQI: float  # คะแนน IAQI ที่คำนวณจาก Temperature
    humidity_quality_level: str  # ระดับคุณภาพอากาศ Humidity
    temperature_quality_level: str  # ระดับคุณภาพอากาศ Temperature
