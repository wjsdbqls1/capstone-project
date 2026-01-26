import os, sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import re
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from sqlalchemy.orm import Session
from db import SessionLocal
from models import AcademicEvent

BASE = "https://home.sch.ac.kr"
URL = "https://home.sch.ac.kr/sch/05/010000.jsp"
BOARD_NO = "20110224223754285127"

def parse_dt_text(year: int, dt_text: str):
    # 예:
    # "01 01(목)" -> [1,1]
    # "01 05(월) ~ 01 09(금)" -> [1,5,1,9]
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
        end = datetime(year, em, ed).date()
    except ValueError:
        return None, None

    return start, end


def fetch_year(year: int):
    params = {
        "board_no": BOARD_NO,
        "defparam-year_month": f"{year}-01",
    }
    headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    resp = requests.get(URL, params=params, headers=headers, timeout=30)
    html = resp.text
    print("STATUS:", resp.status_code)
    print("FINAL_URL:", resp.url)

    soup = BeautifulSoup(html, "html.parser")

    dts = soup.select(".info .list dl dt")
    dds = soup.select(".info .list dl dd")

    print("FETCHED_LEN:", len(html))
    print("HAS_INFO_DIV:", soup.select_one(".info") is not None)
    print("DT:", len(dts), "DD:", len(dds))

    events = []
    for dt, dd in zip(dts, dds):
        dt_text = dt.get_text(" ", strip=True)
        title = dd.get_text(" ", strip=True)
        start, end = parse_dt_text(year, dt_text)
        if not start:
            continue
        source_key = f"{year}|{start}|{end}|{title}"
        events.append((title, start, end, source_key))
    print("DT_TEXT:", dt_text)
    return events

def upsert(db: Session, year: int, title, start, end, source_key):
    e = db.query(AcademicEvent).filter(AcademicEvent.source_key == source_key).first()
    if not e:
        e = AcademicEvent(
            year=year,
            title=title,
            start_date=start,
            end_date=end,
            source_key=source_key,
        )
        db.add(e)

def main():
    year = 2026
    db = SessionLocal()
    try:
        events = fetch_year(year)
        print("events:", len(events))
        for title, start, end, source_key in events:
            upsert(db, year, title, start, end, source_key)
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    main()
