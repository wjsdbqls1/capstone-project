import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db
from models import User

load_dotenv()

r = APIRouter(prefix="/auth", tags=["auth"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALG = os.getenv("JWT_ALG", "HS256")


class RegisterIn(BaseModel):
    student_no: str
    name: str
    department: str | None = None
    grade: int
    password: str


class LoginIn(BaseModel):
    student_no: str
    password: str


def create_token(user_id: int):
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


@r.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.student_no == data.student_no).first()
    if exists:
        raise HTTPException(status_code=409, detail="student_no already exists")

    u = User(
        student_no=data.student_no,
        name=data.name,
        department=data.department,
        role="student",
        grade=data.grade,
        password_hash=pwd.hash(data.password),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "student_no": u.student_no, "name": u.name}


@r.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.student_no == data.student_no).first()
    if (not u) or (not pwd.verify(data.password, u.password_hash)):
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = create_token(u.id)
    
    # ★ [수정] role과 name을 함께 반환하도록 변경
    return {
        "access_token": token, 
        "token_type": "bearer",
        "role": u.role,      # 프론트엔드에서 페이지 이동 분기 처리에 필요
        "name": u.name       # (선택) 환영 메시지 등에 사용 가능
    }