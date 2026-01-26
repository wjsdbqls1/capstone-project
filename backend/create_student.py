# backend/create_student.py
from database import SessionLocal
from models import User
from passlib.context import CryptContext

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- 학생 정보 설정 (원하는대로 바꾸세요) ---
student_info = {
    "student_no": "20260001",  # 학번 (아이디)
    "password": "1234",        # 비밀번호
    "name": "김순천",           # 이름
    "department": "컴퓨터소프트웨어공학과", # 학과
    "grade": 3                 # 학년
}

# 이미 있는지 확인
exists = db.query(User).filter(User.student_no == student_info["student_no"]).first()
if not exists:
    new_user = User(
        student_no=student_info["student_no"],
        password_hash=pwd_context.hash(student_info["password"]),
        name=student_info["name"],
        department=student_info["department"],
        grade=student_info["grade"],
        role="student"  # ★ 중요: 학생 권한
    )
    db.add(new_user)
    db.commit()
    print(f"✅ 학생 계정 생성 완료! (학번: {student_info['student_no']} / PW: {student_info['password']})")
else:
    print("ℹ️ 이미 존재하는 학번입니다.")

db.close()