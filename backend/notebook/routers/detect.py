from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models import get_session
from notebook.models.device import DBDevice
from notebook.models.detect import *
from notebook.models.score import DBScore
from notebook.deps import *

router = APIRouter(prefix="/detects", tags=["detects"])

SIZE_PER_PAGE = 50

def calculate_iaqi(value, pollutant):
    # กำหนดตาราง Breakpoints และระดับคุณภาพ
    standards = {
        'Temperature': [
            {'range': (24, 26), 'IAQI': (0, 50), 'level': 'ดี'},
            {'range': (21, 23.99), 'IAQI': (51, 100), 'level': 'ปานกลาง'},
            {'range': (26.01, 28), 'IAQI': (51, 100), 'level': 'ปานกลาง'},
            {'range': (float('-inf'), 20.99), 'IAQI': (101, 500), 'level': 'อันตราย'},
            {'range': (28.01, float('inf')), 'IAQI': (101, 500), 'level': 'อันตราย'}
        ],
        'Humidity': [
            {'range': (50, 60), 'IAQI': (0, 50), 'level': 'ดี'},
            {'range': (40, 49.99), 'IAQI': (51, 100), 'level': 'ปานกลาง'},
            {'range': (60.01, 65), 'IAQI': (51, 100), 'level': 'ปานกลาง'},
            {'range': (float('-inf'), 39.99), 'IAQI': (101, 500), 'level': 'อันตราย'},
            {'range': (65.01, float('inf')), 'IAQI': (101, 500), 'level': 'อันตราย'}
        ]
    }

    for standard in standards.get(pollutant, []):
        low, high = standard['range']
        if low <= value <= high:
            iaqi_low, iaqi_high = standard['IAQI']
            iaqi = ((value - low) / (high - low)) * (iaqi_high - iaqi_low) + iaqi_low
            return {
                'IAQI': round(iaqi, 2),
                'level': standard['level']
            }

    return {'error': 'ค่าที่วัดได้อยู่นอกช่วงมาตรฐาน'}

@router.post("/create")
async def create_detect(
    detect: CreatedDetect,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Detect | None:

    # ตรวจสอบว่า API Key มีอยู่ในฐานข้อมูลหรือไม่
    device = await session.exec(select(DBDevice).where(DBDevice.api_key == detect.api_key))
    device = device.one_or_none()
    if not device:
        raise HTTPException(status_code=400, detail="Invalid API Key. Please add devices first.")

    # หากพบ API Key ในระบบ ให้สร้าง detect ใหม่
    dbdata = DBDetect(**detect.dict())
    session.add(dbdata)
    await session.commit()
    await session.refresh(dbdata)

    # คำนวณ IAQI และบันทึกในตาราง score
    temperature_result = calculate_iaqi(dbdata.temperature, "Temperature")
    humidity_result = calculate_iaqi(dbdata.humidity, "Humidity")

    if 'error' in temperature_result or 'error' in humidity_result:
        raise HTTPException(status_code=400, detail="Calculation error: Out of standard range.")

    score_entry = DBScore(
        api_key=dbdata.api_key,
        device_name=device.device_name,
        humidity=dbdata.humidity,
        temperature=dbdata.temperature,
        timestamp=dbdata.timestamp,
        temperature_IAQI=temperature_result['IAQI'],
        humidity_IAQI=humidity_result['IAQI'],
        temperature_quality_level=temperature_result['level'],
        humidity_quality_level=humidity_result['level'],
    )
    session.add(score_entry)
    await session.commit()

    return Detect.from_orm(dbdata)