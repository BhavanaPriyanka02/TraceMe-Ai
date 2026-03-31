from pydantic import BaseModel, EmailStr
from datetime import date

class ItemCreate(BaseModel):
    user_id: int
    type: str
    name: str
    description: str
    location: str
    date: date

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
class UserLogin(BaseModel):
    email: str
    password: str