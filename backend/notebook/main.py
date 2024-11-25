from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession  # Import AsyncSession

from . import models
from . import routers
from . import config
from .models.users import DBUser

def create_app():
    settings = config.get_settings()
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    models.init_db(settings)
    routers.init_router(app)

    @app.on_event("startup")
    async def on_startup():
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
                        roles=["superadmin"],
                    )
                    await superadmin.set_password("superadminpassword")
                    session.add(superadmin)
                    await session.commit()

    return app

