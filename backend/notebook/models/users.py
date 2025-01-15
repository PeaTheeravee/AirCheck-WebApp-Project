import pydantic

from pydantic import BaseModel, ConfigDict

from sqlmodel import SQLModel, Field

from passlib.context import CryptContext

# สร้าง Context สำหรับการจัดการรหัสผ่าน
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class BaseUser(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    username: str = pydantic.Field(example="admin")
    first_name: str = pydantic.Field(example="Firstname")
    last_name: str = pydantic.Field(example="Lastname")


class User(BaseUser):
    id: int


class ReferenceUser(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    username: str = pydantic.Field(example="admin")
    first_name: str = pydantic.Field(example="Firstname")
    last_name: str = pydantic.Field(example="Lastname")


class UserList(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    users: list[User]


class Login(BaseModel):
    username: str
    password: str


class ChangedPassword(BaseModel):
    current_password: str
    new_password: str


class RegisteredUser(BaseUser):
    password: str = pydantic.Field(example="password")


class UpdatedUser(BaseUser):
    pass


class ChangedPasswordUser(BaseModel):
    current_password: str
    new_password: str


class DBUser(BaseUser, SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)

    password: str
    role: str = Field(default="admin")
    status: str = Field(default="inactive")

    #async def has_roles(self, roles):
    #    for role in roles:
    #        if role in self.roles:
    #            return True
    #    return False

    async def set_password(self, plain_password):
        self.password = pwd_context.hash(plain_password)

    async def verify_password(self, plain_password):
        return pwd_context.verify(plain_password, self.password)