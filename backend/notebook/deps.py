from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import typing
import jwt
from pydantic import ValidationError
from notebook.models.users import *
from . import models
from . import security
from . import config
from notebook.models.blacklist_token import BlacklistToken
from datetime import datetime
from sqlalchemy.future import select  # นำเข้า select สำหรับ AsyncSession

# ตัวจัดการ token แบบ OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")
settings = config.get_settings()

# ฟังก์ชันสำหรับตรวจสอบ token และรีเฟรช token
async def get_current_user(
    token: typing.Annotated[str, Depends(oauth2_scheme)],  # รับ token จาก headers
    session: typing.Annotated[models.AsyncSession, Depends(models.get_session)],  # รับ session จากฐานข้อมูล
) -> User:
    # ตรวจสอบว่า token มีอยู่ใน blacklist หรือไม่
    result = await session.execute(select(BlacklistToken).filter(BlacklistToken.token == token))
    blacklisted_token = result.scalar_one_or_none()  # ใช้ scalar_one_or_none() เพื่อดึงผลลัพธ์

    if blacklisted_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid.",  # ถ้า token ถูก blacklist จะส่งข้อความนี้
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",  # ข้อความเมื่อ token ไม่ถูกต้อง
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # ตรวจสอบว่า token ถูกต้องหรือไม่
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        user_id: int = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except jwt.ExpiredSignatureError:
        # ถ้า token หมดอายุให้พยายามรีเฟรช token
        new_token = security.refresh_access_token(token)  # ใช้ฟังก์ชัน refresh token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired, new token issued",  # แจ้งว่า token หมดอายุและมีการออก token ใหม่
            headers={
                "WWW-Authenticate": "Bearer",
                "new-access-token": new_token  # ส่ง access token ใหม่กลับ
            }

        )
    except jwt.JWTError as e:
        raise credentials_exception

    # ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    user = await session.get(DBUser, user_id)
    if user is None:
        raise credentials_exception

    return user

# ฟังก์ชันนี้จะเช็คเฉพาะผู้ใช้ที่สถานะเป็น "active" เท่านั้น
async def get_current_active_user(
    current_user: typing.Annotated[User, Depends(get_current_user)]
) -> User:
    # ตรวจสอบสถานะของผู้ใช้
    if current_user.status not in ["active"]: 
        raise HTTPException(status_code=400, detail="User is not active.")  # ถ้าผู้ใช้ไม่ได้เป็น active จะคืน error
    return current_user

# ฟังก์ชันนี้จะเช็คเฉพาะ superadmin
async def get_current_active_superuser(
    current_user: typing.Annotated[User, Depends(get_current_user)],
) -> User:
    # ตรวจสอบว่า user มี role เป็น "superadmin" หรือไม่
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"  # ถ้าไม่ใช่ superadmin
        )
    return current_user

# คลาสนี้ใช้สำหรับตรวจสอบ role ของผู้ใช้
class RoleChecker:
    def __init__(self, *allowed_roles: list[str]):
        self.allowed_roles = allowed_roles  # กำหนด role ที่อนุญาต

    def __call__(
        self,
        user: typing.Annotated[User, Depends(get_current_active_user)],  # ผู้ใช้ต้องเป็น active
    ):
        # ตรวจสอบว่า role ของ user ตรงกับ role ที่อนุญาตหรือไม่
        if user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Role not permitted")  # ถ้าไม่ตรงจะปฏิเสธการเข้าถึง
        return user

# ตัวอย่างการใช้ RoleChecker: ใช้กับ role "admin" และ "superadmin"
AdminRoleChecker = RoleChecker("admin", "superadmin")

# ฟังก์ชันสำหรับลบ token ที่หมดอายุจากฐานข้อมูล
async def delete_expired_tokens(session: models.AsyncSession):
    result = await session.execute(select(BlacklistToken).filter(BlacklistToken.expired_at < datetime.utcnow()))
    expired_tokens = result.scalars().all()  # ดึงข้อมูลทั้งหมดที่ตรงเงื่อนไข

    for token in expired_tokens:
        await session.delete(token)
    await session.commit()


