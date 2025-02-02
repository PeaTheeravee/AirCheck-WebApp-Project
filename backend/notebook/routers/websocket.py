from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends
from sqlmodel import select
from typing import Annotated
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models.device import *
from notebook.models import get_session

router = APIRouter(prefix="/ws", tags=["websocket"])

# ตัวแปรเก็บ WebSocket และ API Key ของอุปกรณ์ที่เชื่อมต่อ
connected_devices = {}

@router.websocket("/devices/{api_key}")
async def websocket_devices(
    websocket: WebSocket, 
    api_key: str, 
    session: Annotated[AsyncSession, Depends(get_session)]
):
    await websocket.accept()
    print(f"✅ Device connected: {api_key}")

    # บันทึก WebSocket Connection
    connected_devices[websocket] = api_key

    try:
        # อัปเดตสถานะเป็น 'online'
        result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
        device = result.one_or_none()
        if device:
            device.device_status = "online"
            session.add(device)
            await session.commit()
            print(f"✅ Device {api_key} status updated to 'online'.")

        # รอรับข้อความจนกว่าการเชื่อมต่อจะถูกตัด
        while True:
            data = await websocket.receive_text()
            print(f"📩 Received from {api_key}: {data}")

    except WebSocketDisconnect:
        print(f"✅ Device {api_key} disconnected.")

    finally:
        # ตรวจสอบว่ามี WebSocket นี้อยู่ใน connected_devices หรือไม่
        if websocket in connected_devices:
            disconnected_api_key = connected_devices[websocket]
            del connected_devices[websocket]  # ใช้ del เพื่อหลีกเลี่ยง KeyError

            # อัปเดตสถานะเป็น 'offline'
            result = await session.exec(select(DBDevice).where(DBDevice.api_key == disconnected_api_key))
            device = result.one_or_none()
            if device:
                device.device_status = "offline"
                session.add(device)
                await session.commit()
                print(f"✅ Device {disconnected_api_key} status updated to 'offline'.")

        # ตรวจสอบว่า WebSocket ยังเปิดอยู่ก่อนปิด
        try:
            await websocket.close()
        except RuntimeError:
            print("⚠️ WebSocket already closed, skipping `websocket.close()`")