from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlmodel import SQLModel, Field, Relationship

from . import users


class BaseMemo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    content: str

    user_id: int | None = 1


class CreatedMemo(BaseMemo):
    pass


class UpdatedMemo(BaseMemo):
    pass


class Memo(BaseMemo):
    id: int


class DBMemo(BaseMemo, SQLModel, table=True):
    __tablename__ = "memos"

    id: int = Field(default=None, primary_key=True)

    user_id: int = Field(default=None, foreign_key="users.id")
    user: users.DBUser | None = Relationship()


class MemoList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    memos: list[Memo]
    page: int
    page_count: int
    size_per_page: int