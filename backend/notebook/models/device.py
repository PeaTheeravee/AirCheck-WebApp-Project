from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field, Relationship
import secrets  # สำหรับสร้าง API Key

if TYPE_CHECKING:
    from .users import DBUser


class DeviceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    api_key: str  
    device_name: str  # ชื่ออุปกรณ์
    location: str  # ตำแหน่งของอุปกรณ์
    device_status: str # สถานะอุปกรณ์ offline
    device_settime: int # เวลาในหน่วยนาที
    user_id: int # ใครเป็นผู้เพิ่มอุปกรณ์

class CreatedDevice(BaseModel):
    device_name: str  
    location: str  


class UpdatedDevice(BaseModel):
    device_name: Optional[str] = None  
    location: Optional[str] = None  


class DeviceStatusUpdate(BaseModel):
    device_status: str  


class DeviceTimeUpdate(BaseModel):
    device_settime: int


class DBDevice(SQLModel, table=True):
    __tablename__ = "devices"

    id: int = Field(default=None, primary_key=True)
    api_key: str = Field(default_factory=lambda: secrets.token_hex(16), unique=True)  # สร้าง API Key อัตโนมัติ

    device_name: str
    location: str
    device_status: str = Field(default="offline")
    device_settime: int = Field(default=5)
    user_id: int = Field(foreign_key="users.id")
    
    user: Optional["DBUser"] = Relationship(
        back_populates="devices", 
        sa_relationship_kwargs={"lazy": "selectin"}  
    )


class DeviceList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    devices: list[DeviceRead]
    total: int  # จำนวนผู้ใช้ทั้งหมด
    page: int  # หน้าปัจจุบัน
    size: int  # จำนวนผู้ใช้ต่อหน้า
    total_pages: int  # จำนวนหน้าทั้งหมด
