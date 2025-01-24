import pydantic

from pydantic import BaseModel, ConfigDict

from sqlmodel import SQLModel, Field

from passlib.context import CryptContext

# สร้าง Context สำหรับการจัดการรหัสผ่าน
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class BaseUser(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    username: str 
    first_name: str 
    last_name: str 
    password: str 


class User(BaseUser):
    id: int


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
    username: str
    first_name: str
    last_name: str


class DBUser(BaseUser, SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)

    password: str
    role: str = Field(default="admin")
    status: str = Field(default="inactive")


    async def set_password(self, plain_password):
        self.password = pwd_context.hash(plain_password)

    async def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.password)
    

class UserList(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    users: list[User]
    total: int  # จำนวนผู้ใช้ทั้งหมด
    page: int  # หน้าปัจจุบัน
    size: int  # จำนวนผู้ใช้ต่อหน้า
    total_pages: int  # จำนวนหน้าทั้งหมด