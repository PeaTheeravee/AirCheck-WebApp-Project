from typing import Annotated

from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, HTTPException, Depends, Query

from sqlmodel import Session, select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from notebook.models import *
from notebook.models.memo import *

from notebook.models.users import *

from notebook.deps import *

import math


router = APIRouter(prefix="/memos", tags=["memos"])

SIZE_PER_PAGE = 50


@router.post("/create")
async def create_memo(
    memo: CreatedMemo,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(AdminRoleChecker)],  # Admin หรือ SuperAdmin เท่านั้น
) -> Memo | None:

    data = memo.dict()

    dbmemo = DBMemo(**data)
    session.add(dbmemo)
    await session.commit()
    await session.refresh(dbmemo)

    return Memo.from_orm(dbmemo)


@router.get("/all")
async def read_memos(
    session: Annotated[AsyncSession, Depends(get_session)],
    page: int = 1,
) -> MemoList:

    result = await session.exec(select(DBMemo).offset((page - 1) * SIZE_PER_PAGE).limit(SIZE_PER_PAGE))
    memos = result.all()
        
    page_count = int(
        math.ceil(
            (await session.exec(select(func.count(DBMemo.id)))).first()
            / SIZE_PER_PAGE
        )
    )

    print("page_count", page_count)
    print("memos", memos)

    return MemoList.from_orm(
        dict(memos=memos, page_count=page_count, page=page, size_per_page=SIZE_PER_PAGE)
    )


@router.get("/{memo_id}")
async def read_memo(
    memo_id: int, session: Annotated[AsyncSession, Depends(get_session)]
) -> Memo:

    db_memo = await session.get(DBMemo, memo_id)
    if db_memo:
        return Memo.from_orm(db_memo)

    raise HTTPException(status_code=404, detail="Item not found")


@router.put("/{memo_id}/update")
async def update_memo(
    memo_id: int,
    memo: UpdatedMemo,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Memo:

    data = memo.dict()

    db_memo = await session.get(DBMemo, memo_id)
    db_memo.sqlmodel_update(data)
    
    session.add(db_memo)
    await session.commit()
    await session.refresh(db_memo)

    return Memo.from_orm(db_memo)


@router.delete("/{memo_id}/delete")
async def delete_memo(
    memo_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    try:

        # ลบข้อมูลในตาราง memos
        db_memo = await session.get(DBMemo, memo_id)
        if db_memo:
            await session.delete(db_memo)
            await session.commit()

            return dict(message="delete success")
        else:
            return dict(message="memo not found")

    except IntegrityError as e:
        await session.rollback()
        return dict(message=f"Failed to delete due to integrity error: {str(e)}")