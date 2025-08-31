from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class DirectoryItem(Base):
    __tablename__ = "directory_items"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("directory_items.id"), nullable=True)

    parent = relationship("DirectoryItem", remote_side=[id], backref="children")

    def __repr__(self):
        return f"<DirectoryItem {self.code}: {self.name}>"
