from pydantic import BaseModel
from typing import List, Optional


class DirectoryItemBase(BaseModel):
    code: str
    name: str
    parent_code: Optional[str] = None


class DirectoryItemCreate(DirectoryItemBase):
    pass


class DirectoryItemUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    parent_code: Optional[str] = None


class DirectoryItem(DirectoryItemBase):
    id: int
    children: List["DirectoryItem"] = []

    class Config:
        from_attributes = True


DirectoryItem.model_rebuild()


class SearchQuery(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None


class ImportResult(BaseModel):
    success: bool
    message: str
    imported_count: int
