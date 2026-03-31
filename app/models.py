from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey,Float
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy import Date
from sqlalchemy import Boolean


# USER TABLE
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    type = Column(String)  
    name = Column(String)
    description = Column(Text)

    location = Column(String)
    date = Column(Date)
    status = Column(String, default="OPEN")
    image_url = Column(String, nullable=True)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    lost_item_id = Column(Integer, ForeignKey("items.id"))
    found_item_id = Column(Integer, ForeignKey("items.id"))

    score = Column(Float) 
    status = Column(String, default="PENDING")  
    match_level = Column(String) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    item_id = Column(Integer, ForeignKey("items.id"))

    message = Column(String)
    is_read = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())