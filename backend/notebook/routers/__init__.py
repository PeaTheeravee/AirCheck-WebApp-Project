from . import users
from . import authentication
from . import device
from . import detect

def init_router(app):
    app.include_router(users.router)
    app.include_router(authentication.router)
    app.include_router(device.router)
    app.include_router(detect.router)