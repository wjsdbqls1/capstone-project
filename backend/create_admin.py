# backend/create_admin.py
import sys
import os

# (경로 문제 방지를 위한 설정)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User
from passlib.context import CryptContext

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 관리자 계정 정보 설정
admin_id = "assistant"
admin_pw = "1234"

# 이미 있는지 확인
exists = db.query(User).filter(User.student_no == admin_id).first()
if not exists:
    new_user = User(
        id=1,  # ★ [중요] 크롤링을 위해 강제로 1번 부여
        student_no=admin_id,
        password_hash=pwd_context.hash(admin_pw),
        name="조교",
        role="assistant", 
        grade=0
    )
    db.add(new_user)
    db.commit()
    print(f"✅ 조교 계정 생성 완료! (ID: 1 / PW: {admin_pw})")
else:
    print("ℹ️ 이미 조교 계정이 존재합니다.")

db.close()