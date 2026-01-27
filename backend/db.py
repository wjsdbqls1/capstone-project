import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# 환경 변수를 읽어오되, 없으면 기본값을 할당합니다.
u = os.getenv("DB_USER", "appuser")
p = os.getenv("DB_PASSWORD", "apppassword")
h = os.getenv("DB_HOST", "db")   # 도커 서비스 이름인 'db' 사용
port = os.getenv("DB_PORT", "3306") # 기본 포트 3306 사용
db = os.getenv("DB_NAME", "admin_assistant")

# 포트가 문자열 'None'이거나 비어있는 경우를 대비해 한 번 더 체크합니다.
if not port or port == 'None':
    port = "3306"

DATABASE_URL = f"mysql+pymysql://{u}:{p}@{h}:{port}/{db}?charset=utf8mb4"

# 여기서 에러가 발생했었습니다. 이제 포트가 확실히 숫자로 바뀔 수 있는 문자열이므로 안전합니다.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()