# check_absence_v2.py
import sys
import os

# 백엔드 경로 설정
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.database import SessionLocal
from backend.models import User, AbsenceRequest

def check_data():
    db = SessionLocal()
    try:
        print("\n=== [1] 전체 유저 목록 ===")
        users = db.query(User).all()
        for u in users:
            print(f"ID: {u.id} | 학번: {u.student_no} | 이름: {u.name} | 권한: {u.role}")

        print("\n=== [2] 공결 신청 내역 확인 ===")
        requests = db.query(AbsenceRequest).all()
        
        if not requests:
            print("❌ 신청된 공결 내역이 없습니다.")
        
        for req in requests:
            # req.user 객체를 통해 정보 접근
            if req.user:
                author_name = req.user.name
                author_id = req.user.id
                author_no = req.user.student_no
            else:
                author_name = "알수없음(탈퇴함)"
                author_id = "Unknown"
                author_no = "?"

            print(f"신청ID: {req.id} | 과목: {req.course_name} | 작성자: {author_name} (ID: {author_id}, 학번: {author_no})")

    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()