from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from . import config
import jwt
from notebook.models.blacklist_token import BlacklistToken
from notebook.models import AsyncSession

ALGORITHM = "HS256"
settings = config.get_settings()

# ตัวจัดการ token แบบ OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def refresh_access_token(refresh_token: str, session: AsyncSession):
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")

        if user_id is None:
            raise Exception("Invalid token")
        
        # ตรวจสอบว่า refresh token ถูก blacklist หรือไม่
        blacklisted_token = session.query(BlacklistToken).filter(BlacklistToken.token == refresh_token).first()
        if blacklisted_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is blacklisted")

        # สร้าง access token ใหม่
        new_access_token = create_access_token(data={"sub": user_id})

        # บันทึก refresh token ใน blacklist และตั้งค่า expired_at
        expired_at = datetime.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
        new_blacklisted_token = BlacklistToken(token=refresh_token, expired_at=expired_at)
        session.add(new_blacklisted_token)
        session.commit()

        return new_access_token
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

# ฟังก์ชันสำหรับตรวจสอบว่า access token หมดอายุหรือไม่
def is_token_expired(token: str) -> bool:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        if exp is None:
            return True
        return datetime.utcnow() > datetime.utcfromtimestamp(exp)
    except jwt.ExpiredSignatureError:
        return True
    except jwt.JWTError:
        return False

# ฟังก์ชันสำหรับลบ token ที่หมดอายุจากฐานข้อมูล
#async def delete_expired_tokens(session: AsyncSession):
#   expired_tokens = await session.query(BlacklistToken).filter(BlacklistToken.expired_at < datetime.utcnow()).all()
#    for token in expired_tokens:
#        await session.delete(token)
#    await session.commit()


