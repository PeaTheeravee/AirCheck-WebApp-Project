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
async def websocket_devices(websocket: WebSocket, api_key: str, session: Annotated[AsyncSession, Depends(get_session)]):

    await websocket.accept()
    try:
        # บันทึกการเชื่อมต่อ
        connected_devices[websocket] = api_key
        print(f"Device connected: {api_key}")

        # อัปเดตสถานะเป็น 'online'
        result = await session.exec(select(DBDevice).where(DBDevice.api_key == api_key))
        device = result.one_or_none()
        if device:
            device.device_status = "online"
            session.add(device)
            await session.commit()
            print(f"Device {api_key} status updated to online.")

        # รอจนกว่าจะมีการตัดการเชื่อมต่อ
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        # ลบ WebSocket ออกจากตัวแปรและอัปเดตสถานะเป็น 'offline'
        if websocket in connected_devices:
            disconnected_api_key = connected_devices.pop(websocket)
            print(f"Device disconnected: {disconnected_api_key}")

            result = await session.exec(select(DBDevice).where(DBDevice.api_key == disconnected_api_key))
            device = result.one_or_none()
            if device:
                device.device_status = "offline"
                session.add(device)
                await session.commit()
                print(f"Device {disconnected_api_key} status updated to 'offline'.")