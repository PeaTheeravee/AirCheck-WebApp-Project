from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel

class BaseDetect(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    DeviceID: str  # DeviceID ใช้ตัวพิมพ์ใหญ่
    Humidity: Optional[float] = 0.0  # ค่าดีฟอลต์เป็น 0.0
    Temperature: Optional[float] = 0.0  # ค่าดีฟอลต์เป็น 0.0
    Timestamp: Optional[datetime] = None

class CreatedDetect(BaseDetect):
    pass

class Detect(BaseDetect):
    id: int

class DBDetect(Detect, SQLModel, table=True):
    __tablename__ = "detects"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    DeviceID: str = Field(..., sa_column_kwargs={"unique": True})  # ค่าของ DeviceID ต้องเป็น unique ในฐานข้อมูล
    Timestamp: Optional[datetime] = None  # Timestamp

class DetectList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    detects: list[Detect]
    page: int
    page_size: int
    size_per_page: int
