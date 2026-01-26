# backend/scripts/sync_external_notices.py
import time
import random
import sys
import os
import re
import requests
import uuid
import urllib3
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# SSL 경고 숨기기
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 경로 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from database import SessionLocal
from models import Notice, User

# 설정
BASE_URL = "https://home.sch.ac.kr"
LIST_URL = "https://home.sch.ac.kr/csw/05/01.jsp"
BOARD_NO = "20211127173805974033"

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "external_notices")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ★ [핵심] 브라우저처럼 보이기 위한 세션 설정 함수
def get_browser_session():
    session = requests.Session()
    
    # 1. 진짜 브라우저 헤더 정보
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": "https://home.sch.ac.kr/csw/05/01.jsp", # 내가 어디서 왔는지 알려줌
        "Upgrade-Insecure-Requests": "1"
    }
    session.headers.update(headers)
    
    # 2. 연결 끊겨도 재시도하는 로직 (최대 3번)
    retry_strategy = Retry(
        total=3,
        backoff_factor=1, # 1초, 2초, 4초 대기 후 재시도
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    
    return session

def parse_date(date_str):
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except:
        return datetime.today().date()

def download_file(session, file_url, original_filename):
    try:
        ext = os.path.splitext(original_filename)[1]
        saved_filename = f"{uuid.uuid4()}{ext}"
        saved_path = os.path.join(UPLOAD_DIR, saved_filename)
        
        # 세션(session)을 사용해서 다운로드
        resp = session.get(file_url, stream=True, timeout=30, verify=False)
        if resp.status_code == 200:
            with open(saved_path, "wb") as f:
                f.write(resp.content)
            return saved_filename
    except Exception as e:
        print(f"      ❌ 다운로드 오류: {e}")
    return None

def fetch_notice_detail(session, detail_url):
    try:
        # 세션 사용
        resp = session.get(detail_url, timeout=30, verify=False)
        soup = BeautifulSoup(resp.text, "html.parser")

        content_div = soup.select_one(".board_contents")
        content_html = str(content_div) if content_div else "<p>내용 없음</p>"

        posted_date = datetime.today().date()
        meta_list = soup.select(".board_title ul li")
        for meta in meta_list:
            text = meta.get_text(strip=True)
            if text.startswith("등록일"):
                date_str = text.split(":", 1)[-1].strip()
                posted_date = parse_date(date_str)

        file_info = None
        for a in soup.select(".board_file a"):
            href = a.get("href")
            if not href: continue
            
            f_name = a.get_text(strip=True)
            f_url = urljoin(BASE_URL, href)
            
            saved_name = download_file(session, f_url, f_name)
            if saved_name:
                file_info = {"path": saved_name, "original_name": f_name}
                break

        return posted_date, content_html, file_info

    except Exception as e:
        print(f"   ⚠️ 상세 파싱 오류: {e}")
        return datetime.today().date(), "", None

def get_next_offset(next_url):
    try:
        qs = parse_qs(urlparse(next_url).query)
        offset_list = qs.get("pager.offset") or qs.get("pager offset")
        if offset_list:
            return int(offset_list[0])
    except ValueError:
        pass
    return None

def main():
    db = SessionLocal()
    
    # ★ 먼저 관리자 계정(ID=1)이 있는지 확인 (안전장치)
    admin_check = db.query(User).filter(User.id == 1).first()
    if not admin_check:
        print("❌ 오류: ID가 1인 관리자 계정이 없습니다.")
        print("   먼저 'python backend/create_admin.py'를 실행해주세요.")
        return

    print("📡 [외부공지] 학과 홈페이지(CSW) 전체 크롤링 시작...")

    # ★ 세션 생성 (브라우저처럼 행동)
    session = get_browser_session()

    try:
        current_offset = 0
        total_count = 0
        
        while True:
            # 2~4초 대기 (조금 더 늘림)
            sleep_time = random.uniform(2, 4)
            print(f"   ⏳ {sleep_time:.1f}초 대기 후 요청...")
            time.sleep(sleep_time)

            print(f"   📄 목록 페이지 조회 중... (offset: {current_offset})")
            
            params = {"mode": "list", "board_no": BOARD_NO, "pager.offset": current_offset}
            
            # ★ session.get 사용
            resp = session.get(LIST_URL, params=params, timeout=30, verify=False)
            soup = BeautifulSoup(resp.text, "html.parser")

            rows = soup.select("table.type_board td.subject a")
            
            if not rows:
                print("   ℹ️ 게시글이 더 이상 없습니다.")
                break

            for a in rows:
                title = a.get_text(strip=True)
                href = a.get("href")
                if not href: continue
                
                detail_url = urljoin(LIST_URL, href)
                
                # 중복 확인
                exists = db.query(Notice).filter(
                    Notice.title == title, 
                    Notice.source == "external"
                ).first()
                
                if exists:
                    continue

                print(f"      ➕ 신규 공지 발견: {title}")
                
                # 상세 페이지 들어가기 전에도 짧게 대기
                time.sleep(1)
                
                posted_date, content_html, file_data = fetch_notice_detail(session, detail_url)

                new_notice = Notice(
                    title=title,
                    content_html=content_html,
                    posted_date=posted_date,
                    target_grade=0,
                    author_id=1,  # 관리자 ID
                    source="external",
                    file_path=file_data["path"] if file_data else None,
                    original_filename=file_data["original_name"] if file_data else None
                )
                db.add(new_notice)
                total_count += 1
            
            db.commit() # 한 페이지 끝날 때마다 저장

            next_btn = soup.select_one(".board_page a.pager.next")
            if next_btn and next_btn.get("href"):
                next_page_url = urljoin(LIST_URL, next_btn["href"])
                next_offset = get_next_offset(next_page_url)
                
                if next_offset is not None and next_offset > current_offset:
                    current_offset = next_offset
                else:
                    print("   ℹ️ 마지막 페이지입니다.")
                    break
            else:
                print("   ℹ️ 마지막 페이지입니다.")
                break
        
        if total_count > 0:
            print(f"✅ [외부공지] 총 {total_count}개 신규 저장 완료!")
        else:
            print("ℹ️ [외부공지] 새로운 공지사항이 없습니다.")

    except Exception as e:
        print(f"❌ 크롤링 중 치명적 오류: {e}")
    finally:
        db.close()
        session.close() # 세션 닫기

if __name__ == "__main__":
    main()