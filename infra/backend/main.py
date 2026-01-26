import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from db import engine
from deps import get_db
from models import User
from models import Inquiry

print("LOADED MAIN:", __file__)

load_dotenv()

app = FastAPI()
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALG = os.getenv("JWT_ALG", "HS256")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db-ping")
def db_ping():
    with engine.connect() as conn:
        v = conn.execute(text("SELECT 1")).scalar_one()
    return {"db": v}


class RegisterIn(BaseModel):
    student_no: str
    name: str
    department: str | None = None
    password: str


class LoginIn(BaseModel):
    student_no: str
    password: str


def create_token(user_id: int):
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


@app.post("/auth/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    pw_bytes = data.password.encode("utf-8")
    print("DEBUG password repr:", repr(data.password))
    print("DEBUG password bytes:", len(pw_bytes))
    if len(pw_bytes) > 72:
        raise HTTPException(status_code=400, detail=f"password too long: {len(pw_bytes)} bytes (bcrypt max 72)")

    exists = db.query(User).filter(User.student_no == data.student_no).first()
    if exists:
        raise HTTPException(status_code=409, detail="student_no already exists")

    u = User(
        student_no=data.student_no,
        name=data.name,
        department=data.department,
        role="student",
        password_hash=pwd.hash(data.password),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "student_no": u.student_no, "name": u.name}


@app.post("/auth/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.student_no == data.student_no).first()
    if (not u) or (not pwd.verify(data.password, u.password_hash)):
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = create_token(u.id)
    return {"access_token": token, "token_type": "bearer"}

class InquiryCreateIn(BaseModel):
    user_id: int
    title: str
    content: str

@app.post("/inquiries")
def create_inquiry(data: InquiryCreateIn, db: Session = Depends(get_db)):
    q = Inquiry(
        user_id=data.user_id,
        title=data.title,
        content=data.content,
        status="OPEN",
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"id": q.id, "status": q.status}

@app.get("/inquiries")
def list_inquiries(db: Session = Depends(get_db)):
    rows = db.query(Inquiry).order_by(Inquiry.id.desc()).limit(50).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "title": r.title,
            "status": r.status,
            "created_at": str(r.created_at),
        }
        for r in rows
    ]