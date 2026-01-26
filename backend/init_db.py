# backend/init_db.py
from database import engine
from models import Base
import models  # 모델들이 등록되도록 import

def init_tables():
    print("⏳ 테이블 생성을 시작합니다...")
    try:
        # 데이터베이스에 연결하여 모델에 정의된 모든 테이블을 생성합니다.
        Base.metadata.create_all(bind=engine)
        print("✅ 테이블 생성이 성공적으로 완료되었습니다!")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    init_tables()