# reset_absence.py
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.database import SessionLocal
# ★ AbsenceAttachment 추가
from backend.models import AbsenceRequest, AbsenceHistory, AbsenceAttachment

def reset_data():
    db = SessionLocal()
    try:
        # ★ 삭제 순서가 중요합니다! (자식 -> 부모)
        
        # 1. 첨부파일 먼저 삭제 (AbsenceRequest를 참조하고 있음)
        print("1. 첨부파일 삭제 중...")
        db.query(AbsenceAttachment).delete()
        
        # 2. 히스토리 삭제
        print("2. 처리 내역(History) 삭제 중...")
        db.query(AbsenceHistory).delete()
        
        # 3. 마지막으로 신청서 삭제
        print("3. 공결 신청서 삭제 중...")
        db.query(AbsenceRequest).delete()
        
        db.commit()
        print("\n✅ 초기화 완료! 모든 공결 데이터가 삭제되었습니다.")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        db.rollback() # 에러 나면 되돌리기
    finally:
        db.close()

if __name__ == "__main__":
    reset_data()