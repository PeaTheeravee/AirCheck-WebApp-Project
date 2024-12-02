from datetime import datetime

from typing import Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import Field, SQLModel
import sqlalchemy as sa

#สำหรับเก็บค่าจากเซ็นเซอร์วัดอุณหภูมิ(temperature)และความชื้นรุ่น(humidity) คือ BaseDetect
class BaseDetect(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    DeviceID: str
    Humidity : float | None = 0
    Temperature : float | None = 0
    Timestamp: Optional[datetime]


class CreatedDetect(BaseDetect):
    pass


class UpdatedDetect(BaseDetect):
    pass


class Detect(BaseDetect):
    id: int
    data_id: int


class DBDetect(Detect, SQLModel, table=True):
    __tablename__ = "detects"
    id: int = Field(default=None, primary_key=True)
    data_id: int = Field(sa_column=sa.Column(sa.BigInteger, autoincrement=True))  # data_id เป็น BIGSERIAL


class DetectList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    detects: list[Detect]
    page: int
    page_size: int
    size_per_page: int