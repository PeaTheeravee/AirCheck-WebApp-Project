from datetime import datetime
from sqlmodel import SQLModel, Field

class BlacklistToken(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    token: str  # ตัวแปรสำหรับเก็บ token ที่ถูกบล็อค
    created_at: datetime = Field(default_factory=datetime.utcnow)  # เวลาที่บล็อค token
    expired_at: datetime  # เวลาที่ token หมดอายุ
    
    def is_expired(self) -> bool:
        #ตรวจสอบว่า token หมดอายุแล้วหรือยัง
        return datetime.utcnow() > self.expired_at
