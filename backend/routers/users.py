# backend/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from deps import get_db, get_current_user
from models import User

r = APIRouter(prefix="/users", tags=["users"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


@r.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    # ★ grade 필드를 명시적으로 포함하여 반환
    return {
        "id": current_user.id,
        "student_no": current_user.student_no,
        "name": current_user.name,
        "department": current_user.department,
        "role": current_user.role,
        "grade": current_user.grade,  # ★ 이 부분이 빠져 있었을 것입니다.
        "status": current_user.status,
        "must_change_password": current_user.must_change_password,
    }


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


@r.post("/me/password")
def change_my_password(
    data: ChangePasswordIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 현재 비밀번호 확인
    if not pwd.verify(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")

    if len(data.new_password) < 4:
        raise HTTPException(status_code=400, detail="새 비밀번호는 4자 이상이어야 합니다.")

    current_user.password_hash = pwd.hash(data.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"ok": True}
