from typing import Annotated


from fastapi import APIRouter, Depends


from notebook.models import *
from notebook.models.detect import *


from notebook.deps import *


router = APIRouter(prefix="/detects", tags=["detects"])

SIZE_PER_PAGE = 50

@router.post("/create")
async def create_detect(
    detect: CreatedDetect,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Detect | None :

    data = detect.dict()

    dbdata = DBDetect(**data)
    session.add(dbdata)
    await session.commit()
    await session.refresh(dbdata)

    return Detect.from_orm(dbdata)