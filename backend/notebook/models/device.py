from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field, Relationship
import secrets  # สำหรับสร้าง API Key

from . import users

class BaseDevice(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_name: str  # ชื่ออุปกรณ์
    location: str  # ตำแหน่งของอุปกรณ์
    user_id: int | None = None  # ใครเป็นผู้เพิ่มอุปกรณ์


class CreatedDevice(BaseDevice):
    pass


class UpdatedDevice(BaseDevice):
    pass


class Device(BaseDevice):
    id: int
    api_key: str  # API Key ของอุปกรณ์


class DBDevice(SQLModel, table=True):
    __tablename__ = "devices"

    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(default_factory=lambda: secrets.token_hex(16), unique=True)  # สร้าง API Key อัตโนมัติ

    device_name: str
    location: str
    user_id: int = Field(default=None, foreign_key="users.id")
    user: users.DBUser | None = Relationship()


class DeviceList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    devices: list[Device]
    page: int
    page_count: int
    size_per_page: int