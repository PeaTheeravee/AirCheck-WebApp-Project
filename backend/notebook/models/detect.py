from datetime import datetime

from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel

#สำหรับเก็บค่าจากเซ็นเซอร์วัดอุณหภูมิ(temperature)และความชื้นรุ่น(humidity) คือ BaseDetect
class BaseDetect(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: int
    humidity : float | None = 0
    temperature : float | None = 0
    timestamp: Optional[datetime]


class CreatedDetect(BaseDetect):
    pass


class UpdatedDetect(BaseDetect):
    pass


class Detect(BaseDetect):
    id: int


class DBDetect(Detect, SQLModel, table=True):
    __tablename__ = "detects"
    id: int = Field(default=None, primary_key=True)


class DetectList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    detects: list[Detect]
    page: int
    page_size: int
    size_per_page: int