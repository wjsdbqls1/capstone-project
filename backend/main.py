# backend/main.py
import os  # ★ 파일 경로 제어를 위해 추가
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime, date
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# DB 및 모델 관련
from database import engine, SessionLocal
from models import Base, AcademicEvent

# 라우터들
from routers import (
    users, auth, academic_calendar, inquiries, 
    notices, notices_detail, faqs, absence, admin_notices, admin_absence, memos
)

# 테이블 자동 생성
Base.metadata.create_all(bind=engine)

app = FastAPI()

# -----------------------------------------------------------
# [1] 설정 및 미들웨어
# -----------------------------------------------------------

# CORS 설정: 로컬 주소와 현재 AWS 서버 IP를 모두 추가합니다.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",          # 리액트 기본 포트
    "http://13.219.208.109:3000",     # ★ 작성자님의 AWS 서버 IP 추가
    "http://13.219.208.109",          # 포트 없는 버전도 추가
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # 허용 목록 적용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ★ [중요] 업로드 폴더 자동 생성 및 정적 파일 연결
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    print(f"📂 '{UPLOAD_DIR}' 폴더가 생성되었습니다.")

# http://13.219.208.109:8000/uploads/파일명 으로 접근 가능하게 설정
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# -----------------------------------------------------------
# [2] 라우터 등록
# -----------------------------------------------------------
app.include_router(users.r)
app.include_router(auth.r)
app.include_router(academic_calendar.r)
app.include_router(inquiries.r)
app.include_router(notices.r)
app.include_router(notices_detail.r)
app.include_router(faqs.r)
app.include_router(absence.r)
app.include_router(admin_notices.r)
app.include_router(admin_absence.router)
app.include_router(memos.router)


# -----------------------------------------------------------
# [3] 학사일정 크롤링 로직
# -----------------------------------------------------------
URL = "https://home.sch.ac.kr/sch/05/010000.jsp"
BOARD_NO = "20110224223754285127"

def parse_dt_text(year: int, dt_text: str):
    nums = re.findall(r"\d{2}", dt_text)
    
    if len(nums) < 2:
        return None, None

    sm, sd = int(nums[0]), int(nums[1])

    if len(nums) >= 4:
        em, ed = int(nums[2]), int(nums[3])
    else:
        em, ed = sm, sd

    try:
        start = datetime(year, sm, sd).date()
        if em < sm:
             end = datetime(year + 1, em, ed).date()
        else:
             end = datetime(year, em, ed).date()
    except ValueError:
        return None, None

    return start, end

def fetch_and_save_events(db: Session, year: int):
    params = {
        "board_no": BOARD_NO,
        "defparam-year_month": f"{year}-01",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    
    try:
        print(f"📡 [학사일정] {year}년 데이터 크롤링 시작... ({URL})")
        resp = requests.get(URL, params=params, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            print(f"⚠️ 요청 실패: Status Code {resp.status_code}")
            return

        soup = BeautifulSoup(resp.text, "html.parser")
        
        dts = soup.select(".info .list dl dt")
        dds = soup.select(".info .list dl dd")
        
        count = 0
        for dt, dd in zip(dts, dds):
            dt_text = dt.get_text(" ", strip=True)
            title = dd.get_text(" ", strip=True)
            
            start, end = parse_dt_text(year, dt_text)
            if not start:
                continue
                
            source_key = f"{year}|{start}|{end}|{title}"
            
            existing = db.query(AcademicEvent).filter(AcademicEvent.source_key == source_key).first()
            if not existing:
                e = AcademicEvent(
                    year=year,
                    title=title,
                    start_date=start,
                    end_date=end,
                    source_key=source_key,
                    source="home_sch_kr"
                )
                db.add(e)
                count += 1
        
        db.commit()
        print(f"✅ [학사일정] {year}년 일정 {count}개 신규 저장 완료!")
        
    except Exception as e:
        print(f"⚠️ 크롤링 중 오류 발생: {e}")

# -----------------------------------------------------------
# [4] 서버 시작 이벤트
# -----------------------------------------------------------
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        # 서버 시작 시 2026년 학사일정 최신화
        fetch_and_save_events(db, 2026)
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Hello World"}