import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db
from models import User
from rate_limit import limiter

load_dotenv()

r = APIRouter(prefix="/auth", tags=["auth"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALG = os.getenv("JWT_ALG", "HS256")


class LoginIn(BaseModel):
    student_no: str
    password: str


def create_token(user_id: int):
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


@r.post("/login")
@limiter.limit("10/minute")
def login(request: Request, data: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.student_no == data.student_no).first()
    if (not u) or (not pwd.verify(data.password, u.password_hash)):
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = create_token(u.id)

    # ★ [수정] role과 name을 함께 반환하도록 변경
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": u.role,      # 프론트엔드에서 페이지 이동 분기 처리에 필요
        "name": u.name,      # (선택) 환영 메시지 등에 사용 가능
        "must_change_password": u.must_change_password,
    }