from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field, Relationship

from . import users

class BaseDevice(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: int  # ID ของอุปกรณ์ที่กำหนดเอง
    device_name: str  # ชื่ออุปกรณ์
    location: str  # ตำแหน่งของอุปกรณ์
    user_id: int | None = None  # ใครเป็นผู้เพิ่มอุปกรณ์


class CreatedDevice(BaseDevice):
    pass


class UpdatedDevice(BaseDevice):
    pass


class Device(BaseDevice):
    id: int


class DBDevice(BaseDevice, SQLModel, table=True):
    __tablename__ = "devices"

    id: int = Field(default=None, primary_key=True)

    user_id: int = Field(default=None, foreign_key="users.id")
    user: users.DBUser | None = Relationship()


class DeviceList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    devices: list[Device]
    page: int
    page_count: int
    size_per_page: int