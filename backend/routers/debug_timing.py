# backend/routers/debug_timing.py
# ※ 성능 원인 파악을 위한 임시 진단용 라우터. 원인 확정 후 삭제할 것.
import time
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth import require_assistant
from db import SessionLocal, engine
from deps import get_db
from models import Notice, User

r = APIRouter(prefix="/debug", tags=["debug"])


@r.get("/timing")
def db_timing(db: Session = Depends(get_db), current_user: User = Depends(require_assistant)):
    """공지 등록 경로의 각 DB 작업이 Render 서버 기준으로 실제 몇 초 걸리는지 측정."""
    req_start = time.perf_counter()
    steps = {}

    def measure(label, fn):
        s = time.perf_counter()
        result = fn()
        steps[label] = round(time.perf_counter() - s, 4)
        return result

    # 이미 열려 있는 세션에서의 순수 왕복 1회
    measure("select1_warm", lambda: db.execute(text("SELECT 1")).scalar())
    measure("select1_warm_2", lambda: db.execute(text("SELECT 1")).scalar())

    # 풀에서 새 세션을 꺼낼 때의 비용(pool_pre_ping 포함)
    def new_session_first_query():
        s2 = SessionLocal()
        try:
            return s2.execute(text("SELECT 1")).scalar()
        finally:
            s2.close()

    measure("new_session_checkout+select1", new_session_first_query)

    # 완전히 새로운 커넥션(TCP+TLS 핸드셰이크 포함)
    def raw_connect():
        c = engine.connect()
        try:
            return c.execute(text("SELECT 1")).scalar()
        finally:
            c.close()

    measure("raw_engine_connect", raw_connect)

    # 인증에서 쓰는 사용자 단건 조회
    measure("user_lookup", lambda: db.query(User).filter(User.id == current_user.id).first())

    # 공지 INSERT + COMMIT + refresh
    probe = Notice(
        title="__debug_timing_probe__",
        content_html="probe",
        target_grade=0,
        target_grades="0",
        posted_date=date.today(),
        author_id=current_user.id,
    )

    def insert_commit():
        db.add(probe)
        db.commit()

    measure("insert+commit", insert_commit)
    measure("refresh", lambda: db.refresh(probe))

    # 전체 학생 id 조회 (요청 경로에 남아 있는 부분)
    student_ids = measure(
        "all_student_ids",
        lambda: [u.id for u in db.query(User).filter(User.role == "student").all()],
    )

    def cleanup():
        db.delete(probe)
        db.commit()

    measure("cleanup_delete+commit", cleanup)

    return {
        "steps_sec": steps,
        "student_count": len(student_ids),
        "server_total_sec": round(time.perf_counter() - req_start, 4),
    }
