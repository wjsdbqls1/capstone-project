# backend/run_local.py
"""로컬 테스트용 서버 실행 스크립트.

운영 .env는 운영 Supabase를 가리키므로 그냥 띄우면 로컬 테스트가 운영 데이터를 건드린다.
이 스크립트는 다른 모듈을 불러오기 전에 환경변수를 먼저 덮어써서 완전히 분리된 환경을 만든다.

  DB       이 폴더의 local_test.db (SQLite)
  첨부파일  Supabase 대신 로컬 uploads 폴더
  푸시      키를 비워 둬서 알림은 DB 기록만 남고 실제 발송은 하지 않음
  크롤링    서버 시작 시 외부 사이트 조회 건너뜀

python-dotenv의 load_dotenv()는 이미 들어 있는 환경변수를 덮어쓰지 않으므로,
여기서 먼저 넣어 두면 .env 값보다 항상 우선한다.

사용법:  python run_local.py
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# SQLite URL은 슬래시 경로만 받으므로 윈도우 역슬래시를 바꿔 준다
DB_PATH = os.path.join(BASE_DIR, "local_test.db").replace("\\", "/")

os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"
# 빈 문자열이어야 storage_service가 Supabase 대신 디스크 저장으로 물러난다
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""
os.environ["JWT_SECRET"] = "local-test-only-secret"
os.environ["VAPID_PRIVATE_KEY"] = ""
os.environ["SKIP_STARTUP_CRAWL"] = "1"

os.chdir(BASE_DIR)

if __name__ == "__main__":
    import uvicorn

    print(f"[로컬] DB: {os.environ['DATABASE_URL']}")
    print("[로컬] 운영 Supabase에는 연결하지 않습니다.")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
