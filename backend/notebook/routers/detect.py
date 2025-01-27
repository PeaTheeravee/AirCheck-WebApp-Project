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

def get_quality_level(value, pollutant):
    levels = {
        'PM2.5': [
            {'range': (0, 25), 'level': 'ดี', 'fix': '---------'},
            {'range': (26, 35), 'level': 'ปานกลาง', 'fix': 'ควรสวมหน้ากาก , ควรทำความสะอาดห้อง'},
            {'range': (36, float('inf')), 'level': 'อันตราย', 'fix': 'ต้องสวมหน้ากาก , ใช้เครื่องฟอกอากาศ , ต้องทำความสะอาดห้องเเละทำความสะอาดแผ่นกรองแอร์'}
        ],
        'PM10': [
            {'range': (0, 50), 'level': 'ดี', 'fix': '---------'},
            {'range': (51, 75), 'level': 'ปานกลาง', 'fix': 'ควรสวมหน้ากาก , ควรทำความสะอาดห้อง'},
            {'range': (76, float('inf')), 'level': 'อันตราย', 'fix': 'ต้องสวมหน้ากาก , ใช้เครื่องฟอกอากาศ , ต้องทำความสะอาดห้องเเละทำความสะอาดแผ่นกรองแอร์'}
        ],
        'CO2': [
            {'range': (0, 1000), 'level': 'ดี', 'fix': '---------'},
            {'range': (1001, 1200), 'level': 'ปานกลาง', 'fix': 'เปิดหน้าต่างหรือประตูชั่วคราว , ใช้พัดลมช่วยเพิ่มการถ่ายเทอากาศ'},
            {'range': (1201, float('inf')), 'level': 'อันตราย', 'fix': ' เปิดหน้าต่างหรือประตูให้นานขึ้น , ใช้พัดลมช่วยเพิ่มการถ่ายเทอากาศ'}
        ],
        'TVOC': [
            {'range': (0, 1000), 'level': 'ดี', 'fix': '---------'},
            {'range': (1001, 1100), 'level': 'ปานกลาง', 'fix': 'เปิดหน้าต่างหรือประตูชั่วคราว , ใช้พัดลมช่วยเพิ่มการถ่ายเทอากาศ , ต้องค้นหาเเละกำจัดกลิ่นไม่พึงประสงค์หรือสารเคมีออกจากห้อง'},
            {'range': (1101, float('inf')), 'level': 'อันตราย', 'fix': 'เปิดหน้าต่างหรือประตูให้นานขึ้น , ใช้พัดลมช่วยเพิ่มการถ่ายเทอากาศ , ต้องค้นหาเเละกำจัดกลิ่นไม่พึงประสงค์หรือสารเคมีออกจากห้องทันที'}
        ],
        'Temperature': [
            {'range': (24.00, 26.99), 'level': 'ดี', 'fix': '---------'},
            {'range': (22.00, 23.99), 'level': 'ปานกลาง', 'fix': 'ปรับอุณหภูมิแอร์ให้อยู่ในช่วง 24-26°C'},
            {'range': (27.00, 28.99), 'level': 'ปานกลาง', 'fix': 'ปรับอุณหภูมิแอร์ให้อยู่ในช่วง 24-26°C'},
            {'range': (float('-inf'), 21.99), 'level': 'อันตราย', 'fix': 'ปรับอุณหภูมิแอร์ให้อยู่ในช่วงที่เหมาะสม , ตรวจสอบการตั้งค่า ถ้าพบว่าเกิดจากการทำงานผิดปกติของเเอร์ ปิดเเอร์ เเละติดต่อช่าง'},
            {'range': (29.00, float('inf')), 'level': 'อันตราย', 'fix': 'ปรับอุณหภูมิแอร์ให้อยู่ในช่วงที่เหมาะสม , ใช้พัดลมช่วยกระจายความเย็น , ตรวจสอบการตั้งค่า ถ้าพบว่าเกิดจากการทำงานผิดปกติของเเอร์ ปิดเเอร์ เเละติดต่อช่าง'}
        ],
        'Humidity': [
            {'range': (50.00, 65.99), 'level': 'ดี', 'fix': '---------'},
            {'range': (45.00, 49.99), 'level': 'ปานกลาง', 'fix': 'เปิดใช้เครื่องพ่นไอน้ำเพื่อเพิ่มความชื้น'},
            {'range': (66.00, 70.99), 'level': 'ปานกลาง', 'fix': 'ปรับแอร์เป็น Dry Mode เพื่อลดความชื้น '},
            {'range': (float('-inf'), 44.99), 'level': 'อันตราย', 'fix': 'เปิดใช้เครื่องพ่นไอน้ำเพื่อเพิ่มความชื้นอย่างต่อเนื่อง , ห้ามใช้แอร์โหมดเย็น ตรวจสอบการตั้งค่า ถ้าพบว่าเกิดจากการทำงานผิดปกติของเเอร์ ปิดเเอร์ เเละติดต่อช่าง'},
            {'range': (71.00, float('inf')), 'level': 'อันตราย', 'fix': 'เปิดแอร์ในโหมด Dry Mode อย่างต่อเนื่อง ,  ตรวจสอบการตั้งค่า ถ้าพบว่าเกิดจากการทำงานผิดปกติของเเอร์ ปิดเเอร์ เเละติดต่อช่าง'}
        ]
    }

    if pollutant not in levels:
        return 'ไม่ทราบ'

    for level in levels[pollutant]:
        low, high = level['range']
        if low <= value <= high:
            return level['level'], level['fix']

    return 'ไม่ทราบ'


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

    # คำนวณระดับคุณภาพ
    pm2_5_quality, pm2_5_fix = get_quality_level(dbdata.pm2_5, "PM2.5")
    pm10_quality, pm10_fix = get_quality_level(dbdata.pm10, "PM10")
    co2_quality, co2_fix = get_quality_level(dbdata.co2, "CO2")
    tvoc_quality, tvoc_fix = get_quality_level(dbdata.tvoc, "TVOC")
    humidity_quality, humidity_fix = get_quality_level(dbdata.humidity, "Humidity")
    temperature_quality, temperature_fix = get_quality_level(dbdata.temperature, "Temperature")

    # ตรวจสอบว่ามีข้อมูลในตาราง score สำหรับ API Key นี้หรือยัง
    existing_score = await session.exec(select(DBScore).where(DBScore.api_key == detect.api_key))
    score = existing_score.one_or_none()

    if score:
        # หากมีข้อมูลอยู่แล้ว ทำการอัปเดต
        score.timestamp = dbdata.timestamp
        score.pm2_5_quality_level = pm2_5_quality
        score.pm2_5_fix = pm2_5_fix
        score.pm10_quality_level = pm10_quality
        score.pm10_fix = pm10_fix
        score.co2_quality_level = co2_quality
        score.co2_fix = co2_fix
        score.tvoc_quality_level = tvoc_quality
        score.tvoc_fix = tvoc_fix
        score.humidity_quality_level = humidity_quality
        score.humidity_fix = humidity_fix
        score.temperature_quality_level = temperature_quality
        score.temperature_fix = temperature_fix
        session.add(score)
    else:
        # หากยังไม่มีข้อมูล ทำการเพิ่มใหม่
        score_entry = DBScore(
            api_key=dbdata.api_key,
            timestamp=dbdata.timestamp,
            pm2_5_quality_level=pm2_5_quality,
            pm2_5_fix=pm2_5_fix,
            pm10_quality_level=pm10_quality,
            pm10_fix=pm10_fix,
            co2_quality_level=co2_quality,
            co2_fix=co2_fix,
            tvoc_quality_level=tvoc_quality,
            tvoc_fix=tvoc_fix,
            humidity_quality_level=humidity_quality,
            humidity_fix=humidity_fix,
            temperature_quality_level=temperature_quality,
            temperature_fix=temperature_fix,
        )
        session.add(score_entry)

    await session.commit()

    return Detect.from_orm(dbdata)


@router.get("/{api_key}")
async def get_detects_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[Detect]:

    result = await session.exec(select(DBDetect).where(DBDetect.api_key == api_key))
    detect = result.all()

    if not detect:
        raise HTTPException(status_code=404, detail=f"No detection data found for API Key: {api_key}.")

    return [Detect.from_orm(det) for det in detect]
