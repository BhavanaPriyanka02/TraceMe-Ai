from fastapi import FastAPI, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine,Base
from app import models
from app.embedding import get_similarity
from app.explanation import generate_explanation
from pydantic import BaseModel
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from jose import jwt
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request


Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.staticfiles import StaticFiles

app.mount("/images", StaticFiles(directory="images"), name="images")

app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
@app.get("/{full_path:path}")
def serve_frontend(full_path: str, request: Request):
    if full_path.startswith("api"):
        return {"error": "API route not found"}
    return FileResponse("static/index.html")

class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = pwd_context.hash(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"


@app.post("/api/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not db_user:
        return {"error": "User not found"}

    if not pwd_context.verify(user.password, db_user.password):
        return {"error": "Incorrect password"}

   
    return {
        "user_id": db_user.id,
        "access_token": "dummy_token",  
        "username": db_user.username
    }



@app.post("/api/items")
def add_item(
    name: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    type: str = Form(...),
    user_id: int = Form(...),
    phone: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    import os
    import shutil

    if not os.path.exists("images"):
        os.makedirs("images")

    image_url = None

    if image:
        file_path = f"images/{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"https://traceme-backend.onrender.com/images/{image.filename}"

    item = models.Item(
        user_id=user_id,
        name=name,
        description=description,
        location=location,
        type=type.upper(),
        phone=phone,
        image_url=image_url
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    opposite_type = "FOUND" if item.type == "LOST" else "LOST"

    candidates = db.query(models.Item).filter(
        models.Item.type == opposite_type
    ).all()

    results = []
    match_found = False


    matches_list = []

    for candidate in candidates:
        text1 = (item.name + " " + item.description + " " + item.location).lower()
        text2 = (candidate.name + " " + candidate.description + " " + candidate.location).lower()

        score = float(get_similarity(text1, text2))

        if score >= 0.5:
            matches_list.append((candidate, score))

  
    matches_list = sorted(matches_list, key=lambda x: x[1], reverse=True)[:3]

    for candidate, score in matches_list:

        match_found = True

        if score >= 0.75:
            level = "Strong Match"
        elif score >= 0.6:
            level = "Moderate Match"
        else:
            level = "Weak Match"

        explanation = generate_explanation(candidate)

        if item.type == "LOST":
            lost_id = item.id
            found_id = candidate.id
        else:
            lost_id = candidate.id
            found_id = item.id

    
        existing = db.query(models.Match).filter(
            models.Match.lost_item_id == lost_id,
            models.Match.found_item_id == found_id
        ).first()

        if existing:
            continue

        match = models.Match(
            lost_item_id=lost_id,
            found_item_id=found_id,
            score=score,
            match_level=level
        )

        db.add(match)

        results.append({
            "match_id": None,
            "score": round(score, 2),
            "match_level": level,
            "explanation": explanation
        })


    if matches_list:
        notification = models.Notification(
            user_id=item.user_id,
            message=f"New match found for your item: {item.name}",
            is_read=False
        )
        db.add(notification)

    if match_found:
        item.status = "MATCHED"

    db.commit()


    for i, match in enumerate(db.query(models.Match).filter(
        (models.Match.lost_item_id == item.id) |
        (models.Match.found_item_id == item.id)
    ).all()):
        if i < len(results):
            results[i]["match_id"] = match.id

    results = sorted(results, key=lambda x: x["score"], reverse=True)
    results = results[:3]

    return {
        "message": "Item added successfully",
        "recommendations": results
    }



@app.post("/matches/{match_id}/accept")
def accept_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()

    if not match:
        return {"error": "Match not found"}

    if match.status == "ACCEPTED":
        return {"message": "Match already accepted"}

    match.status = "ACCEPTED"

    lost_item = db.query(models.Item).filter(models.Item.id == match.lost_item_id).first()
    found_item = db.query(models.Item).filter(models.Item.id == match.found_item_id).first()

    if lost_item:
        lost_item.status = "CLAIMED"
    if found_item:
        found_item.status = "CLAIMED"

    db.commit()

    return {
        "message": "Match accepted and items marked as claimed",
        "lost_user_phone": lost_item.phone if lost_item else None,
        "found_user_phone": found_item.phone if found_item else None
    }


@app.post("/matches/{match_id}/reject")
def reject_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()

    if not match:
        return {"error": "Match not found"}

    if match.status == "ACCEPTED":
        return {"message": "Cannot reject an accepted match"}

    if match.status == "REJECTED":
        return {"message": "Match already rejected"}

    match.status = "REJECTED"
    db.commit()

    return {"message": "Match rejected"}



@app.get("/dashboard/{user_id}")
def get_dashboard(user_id: int, db: Session = Depends(get_db)):

    lost_items = db.query(models.Item).filter(
        models.Item.user_id == user_id,
        models.Item.type == "LOST"
    ).all()

    found_items = db.query(models.Item).filter(
        models.Item.user_id == user_id,
        models.Item.type == "FOUND"
    ).all()

    matches = db.query(models.Match).join(
        models.Item,
        (models.Match.lost_item_id == models.Item.id) |
        (models.Match.found_item_id == models.Item.id)
    ).filter(models.Item.user_id == user_id).all()

    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).all()

    return {
        "lost_items": [
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "location": item.location,
                "status": item.status,
                "image_url": item.image_url,
                "phone": item.phone
            }
            for item in lost_items
        ],
        "found_items": [
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "location": item.location,
                "status": item.status,
                "image_url": item.image_url,
                "phone": item.phone
            }
            for item in found_items
        ],
        "matches": [
            {
                "id": match.id,
                "status": match.status,
                "match_level": match.match_level,
                "score": match.score,
                "lost_item_name": db.query(models.Item).filter(models.Item.id == match.lost_item_id).first().name,
                "found_item_name": db.query(models.Item).filter(models.Item.id == match.found_item_id).first().name,
                "phone": db.query(models.Item).filter(models.Item.id == match.found_item_id).first().phone
            }
            for match in matches
        ],
        "notifications": [
    {
        "id": n.id,
        "message": n.message,
        "is_read": n.is_read
    }
            for n in notifications
        ]
    }


@app.post("/notifications/{id}/read")
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    notification = db.query(models.Notification).filter(
        models.Notification.id == id
    ).first()

    if not notification:
        return {"error": "Notification not found"}

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}
