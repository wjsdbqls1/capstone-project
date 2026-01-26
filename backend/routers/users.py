# backend/routers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from deps import get_db, get_current_user
from models import User

r = APIRouter(prefix="/users", tags=["users"])

@r.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    # ★ grade 필드를 명시적으로 포함하여 반환
    return {
        "id": current_user.id,
        "student_no": current_user.student_no,
        "name": current_user.name,
        "department": current_user.department,
        "role": current_user.role,
        "grade": current_user.grade, # ★ 이 부분이 빠져 있었을 것입니다.
    }