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
    score_humidity: float  # คะแนนที่คำนวณจาก Humidity
    score_temperature: float  # คะแนนที่คำนวณจาก Temperature


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
    score_humidity: float  # คะแนนจาก Humidity
    score_temperature: float  # คะแนนจาก Temperature
