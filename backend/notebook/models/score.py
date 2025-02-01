from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field
from datetime import datetime


class ScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    api_key: str  
    timestamp: datetime
    pm2_5_quality_level: str 
    pm2_5_fix: str
    pm10_quality_level: str
    pm10_fix: str 
    co2_quality_level: str
    co2_fix: str
    tvoc_quality_level: str
    tvoc_fix: str
    humidity_quality_level: str 
    humidity_fix: str 
    temperature_quality_level: str
    temperature_fix: str 


class DBScore(SQLModel, table=True):
    __tablename__ = "scores"

    id: int = Field(primary_key=True)
    api_key: str = Field(index=True)  
    timestamp: datetime

    pm2_5_quality_level: str
    pm2_5_fix: str
    pm10_quality_level: str
    pm10_fix: str 
    co2_quality_level: str
    co2_fix: str
    tvoc_quality_level: str 
    tvoc_fix: str 
    humidity_quality_level: str
    humidity_fix: str
    temperature_quality_level: str
    temperature_fix: str 
    