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
            {'range': (0.0, 25.0), 'level': 'ดี', 'fix': '---------'},
            {'range': (25.1, 35.0), 'level': 'ปานกลาง', 'fix': 'ทำความสะอาดห้อง , เปิดหน้าต่างหรือประตูชั่วคราว'},
            {'range': (35.1, float('inf')), 'level': 'อันตราย', 'fix': 'ทำความสะอาดห้องบ่อยขึ้น , ทำความสะอาดแผ่นกรองแอร์ , เปิดหน้าต่างหรือประตูให้นานขึ้น'}
        ],
        'PM10': [
            {'range': (0.0, 50.0), 'level': 'ดี', 'fix': '---------'},
            {'range': (50.1, 75.0), 'level': 'ปานกลาง', 'fix': 'ทำความสะอาดห้อง , เปิดหน้าต่างหรือประตูชั่วคราว'},
            {'range': (75.1, float('inf')), 'level': 'อันตราย', 'fix': 'ทำความสะอาดห้องบ่อยขึ้น , ทำความสะอาดแผ่นกรองแอร์ , เปิดหน้าต่างหรือประตูให้นานขึ้น'}
        ],
        'CO2': [
            {'range': (0.0, 1000.0), 'level': 'ดี', 'fix': '---------'},
            {'range': (1000.1, 1200.0), 'level': 'ปานกลาง', 'fix': 'เปิดหน้าต่างหรือประตูชั่วคราว'},
            {'range': (1200.1, float('inf')), 'level': 'อันตราย', 'fix': 'ใช้พัดลมช่วยเพิ่มการถ่ายเทอากาศ , เปิดหน้าต่างหรือประตูให้นานขึ้น'}
        ],
        'Temperature': [
            {'range': (24.0, 26.0), 'level': 'ดี', 'fix': '---------'},
            {'range': (22.0, 23.99), 'level': 'ปานกลาง', 'fix': 'ปรับอุณหภูมิแอร์ให้อยู่ในช่วง 24-26°C'},
            {'range': (26.01, 28.0), 'level': 'ปานกลาง', 'fix': 'ปรับอุณหภูมิแอร์ให้ต่ำลงเพื่อกลับเข้าสู่ช่วงเหมาะสม '},
            {'range': (float('-inf'), 21.99), 'level': 'อันตราย', 'fix': 'ตรวจสอบรีโมทและตั้งค่าให้เหมาะสม , ปิดแอร์เป็นช่วงสั้น ๆ '},
            {'range': (28.01, float('inf')), 'level': 'อันตราย', 'fix': 'ปรับอุณหภูมิแอร์ให้ต่ำลงเพื่อกลับเข้าสู่ช่วงเหมาะสม , ใช้พัดลมช่วยกระจายความเย็น'}
        ],
        'Humidity': [
            {'range': (50.0, 65.0), 'level': 'ดี', 'fix': '---------'},
            {'range': (45.0, 49.99), 'level': 'ปานกลาง', 'fix': 'วางผ้าชุบน้ำในห้องเพื่อเพิ่มความชื้น'},
            {'range': (65.01, 70.0), 'level': 'ปานกลาง', 'fix': 'เปิดแอร์ในโหมด Dry Mode เพื่อลดความชื้น , เปิดประตูหรือหน้าต่างชั่วคราว'},
            {'range': (float('-inf'), 44.99), 'level': 'อันตราย', 'fix': 'ถังน้ำในห้องเพื่อเพิ่มความชื้น , หลีกเลี่ยงการใช้แอร์โหมดเย็น '},
            {'range': (70.01, float('inf')), 'level': 'อันตราย', 'fix': 'เปิดแอร์ในโหมด Dry Mode อย่างต่อเนื่อง , เปิดหน้าต่างหรือประตูให้นานขึ้น'}
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
    humidity_quality, humidity_fix = get_quality_level(dbdata.humidity, "Humidity")
    temperature_quality, temperature_fix = get_quality_level(dbdata.temperature, "Temperature")

    score_entry = DBScore(
        api_key=dbdata.api_key,
        device_name=device.device_name,
        timestamp=dbdata.timestamp,
        pm2_5_quality_level=pm2_5_quality,
        pm2_5_fix=pm2_5_fix,
        pm10_quality_level=pm10_quality,
        pm10_fix=pm10_fix,
        co2_quality_level=co2_quality,
        co2_fix=co2_fix,
        humidity_quality_level=humidity_quality,
        humidity_fix=humidity_fix,
        temperature_quality_level=temperature_quality,
        temperature_fix=temperature_fix,
    )
    session.add(score_entry)
    await session.commit()

    return Detect.from_orm(dbdata)


@router.get("/all")
async def get_all_detects(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[Detect]:

    result = await session.exec(select(DBDetect))
    detects = result.all()

    if not detects:
        raise HTTPException(status_code=404, detail="No detection data found.")

    return [Detect.from_orm(det) for det in detects]


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


#เมื่อต้องการลบข้อมูลอุปกรณ์
@router.delete("/delete/{api_key}")
async def delete_detect_by_api_key(
    api_key: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ตรวจสอบว่า API Key มีการอ้างอิงใน detect หรือไม่
    result = await session.exec(select(DBDetect).where(DBDetect.api_key == api_key))
    detects = result.all()

    if not detects:
        raise HTTPException(status_code=404, detail="No detection data found for the provided API Key.")

    # ลบข้อมูลทั้งหมดที่เกี่ยวข้องกับ API Key
    for detect in detects:
        await session.delete(detect)
    
    await session.commit()

    return {"message": "All detection data associated with the API Key has been deleted successfully."}


@router.delete("/delete_by_month/{api_key}")
async def delete_detects_by_month(
    api_key: str,
    months_to_delete: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],  # ตรวจสอบ user.status == "active"
):
    # ดึงข้อมูล detect ตาม API Key และจัดเรียงข้อมูลตาม timestamp
    result = await session.exec(
        select(DBDetect).where(DBDetect.api_key == api_key).order_by(DBDetect.timestamp.asc())
    )
    detects = result.all()

    if not detects:
        raise HTTPException(status_code=404, detail="No detection data found for the provided API Key.")

    # จัดกลุ่มข้อมูลตามเดือน
    grouped_by_month = {}
    for detect in detects:
        month_key = detect.timestamp.strftime("%Y-%m") if detect.timestamp else None
        if month_key not in grouped_by_month:
            grouped_by_month[month_key] = []
        grouped_by_month[month_key].append(detect)

    # ตรวจสอบว่ามีเดือนเพียงพอที่จะลบหรือไม่
    if len(grouped_by_month) < months_to_delete:
        raise HTTPException(
            status_code=400,
            detail="Not enough months of detection data to delete the specified number of months."
        )

    # ลบข้อมูลจากเดือนที่เก่าสุด
    months_deleted = 0
    for month in sorted(grouped_by_month.keys()):
        for detect in grouped_by_month[month]:
            await session.delete(detect)
        months_deleted += 1
        if months_deleted >= months_to_delete:
            break

    await session.commit()

    return {"message": f"Deleted {months_deleted} months of detection data successfully."}