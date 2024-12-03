from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession  # Import AsyncSession

from . import models, routers, config
from .models.users import DBUser
from .deps import get_current_user, get_current_active_user, AdminRoleChecker

def create_app():
    settings = config.get_settings()
    app = FastAPI()

    # เพิ่ม middleware สำหรับ CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Initial database
    models.init_db(settings)
    
    # เรียกใช้งาน router ที่มีการตรวจสอบการเข้าถึง
    routers.init_router(app)

    @app.on_event("startup")
    async def on_startup():
        # สร้าง database และผู้ใช้ superadmin ถ้ายังไม่มี
        await models.create_all()

        async for session in models.get_session():  # ใช้ async for เพื่อดึง session
            async with session:  # ใช้ session เป็น context manager
                result = await session.exec(select(DBUser).where(DBUser.username == "superadmin"))
                superadmin = result.one_or_none()

                if not superadmin:
                    superadmin = DBUser(
                        username="superadmin",
                        email="superadmin@localhost",
                        first_name="Super",
                        last_name="Admin",
                        password="superadminpassword",
                        role="superadmin",
                    )
                    await superadmin.set_password("superadminpassword")
                    session.add(superadmin)
                    await session.commit()

    return app
