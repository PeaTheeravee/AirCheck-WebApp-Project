from . import memo
from . import users
from . import authentication
from . import detect

def init_router(app):
    app.include_router(users.router)
    app.include_router(authentication.router)
    app.include_router(memo.router)
    app.include_router(detect.router)