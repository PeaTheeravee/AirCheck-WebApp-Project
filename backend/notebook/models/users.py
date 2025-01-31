from typing import List, Optional, TYPE_CHECKING
from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field, Relationship
from passlib.context import CryptContext

if TYPE_CHECKING:
    from .device import DBDevice

# สร้าง Context สำหรับการจัดการรหัสผ่าน
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str  
    first_name: str
    last_name: str
    role: str  # บทบาท
    status: str  # สถานะผู้ใช้


class CreatedUser(BaseModel):
    username: str
    first_name: str
    last_name: str
    password: str


class ChangedPassword(BaseModel):
    current_password: str
    new_password: str

class ChangedPasswordOther(BaseModel):
    new_password: str
    confirm_new_password: str

class UpdatedUser(BaseModel):
    username: Optional[str] = None  
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class DBUser(SQLModel, table=True):
    __tablename__ = "users"
    
    id: int = Field(default=None, primary_key=True)  

    username: str = Field(unique=True, index=True)
    first_name: str
    last_name: str
    password: str
    role: str = Field(default="admin")
    status: str = Field(default="inactive")

    devices: List["DBDevice"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"lazy": "selectin"}  
    )  

    async def set_password(self, plain_password):
        self.password = pwd_context.hash(plain_password)

    async def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.password)
    

class UserList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    users: list[UserRead]
    total: int  # จำนวนผู้ใช้ทั้งหมด
    page: int  # หน้าปัจจุบัน
    size: int  # จำนวนผู้ใช้ต่อหน้า
    total_pages: int  # จำนวนหน้าทั้งหมด