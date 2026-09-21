import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# SQLite(로컬 테스트용)는 기본적으로 연결을 만든 스레드에서만 쓸 수 있어서,
# FastAPI가 요청을 스레드풀에 나눠 처리할 때 오류가 난다. 로컬일 때만 풀어 준다.
# 운영(PostgreSQL)에서는 빈 값이라 아무 영향이 없다.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    connect_args=connect_args,
)
# 운영은 PostgreSQL이라 left() 같은 내장 함수를 쿼리에서 그대로 쓰는데 SQLite에는 없다.
# 로컬 테스트에서만 같은 이름으로 흉내 내 준다. 운영 경로에서는 이 블록이 아예 실행되지 않는다.
if DATABASE_URL.startswith("sqlite"):
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def _register_sqlite_compat_functions(dbapi_conn, _record):
        dbapi_conn.create_function("left", 2, lambda s, n: (s or "")[: int(n)])
        dbapi_conn.create_function("right", 2, lambda s, n: (s or "")[-int(n):] if int(n) else "")

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()
