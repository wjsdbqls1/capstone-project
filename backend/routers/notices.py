# backend/routers/notices.py
from fastapi import APIRouter, Depends, HTTPException # ★ HTTPException 추가됨
from sqlalchemy.orm import Session
from deps import get_db
from models import Notice

r = APIRouter(prefix="/notices", tags=["notices"])

# 1. 공지사항 목록 조회 (내부 + 외부 통합)
@r.get("")
def list_notices(db: Session = Depends(get_db), source: str = "all", limit: int = 50):
    # source: "all", "internal", "external"
    out = []

    # 1) 내부 공지 or 전체
    if source in ("all", "internal"):
        rows = db.query(Notice).filter(Notice.source == "internal").order_by(Notice.posted_date.desc(), Notice.id.desc()).limit(limit).all()
        for n in rows:
            out.append({
                "source": "internal",
                "id": n.id,
                "title": n.title,
                "posted_date": str(n.posted_date),
                "target_grade": n.target_grade,
                "original_filename": n.original_filename,
                "file_path": n.file_path
            })

    # 2) 외부 공지 or 전체
    if source in ("all", "external"):
        rows = db.query(Notice).filter(Notice.source == "external").order_by(Notice.posted_date.desc(), Notice.id.desc()).limit(limit).all()
        for n in rows:
            out.append({
                "source": "external",
                "id": n.id, # ★ 중요: 외부 공지도 DB ID를 사용
                "title": n.title,
                "posted_date": str(n.posted_date),
                "target_grade": 0, # 외부 공지는 전체 대상
                "original_filename": n.original_filename,
                "file_path": n.file_path
            })

    # 날짜 최신순 정렬
    out.sort(key=lambda x: x["posted_date"], reverse=True)
    return out[:limit]

# 2. 공지사항 상세 조회 (내부/외부 공통)
@r.get("/internal/{notice_id}")
def get_internal_notice_detail(notice_id: int, db: Session = Depends(get_db)):
    # 외부 공지도 이제 DB에 저장되므로, ID로 조회하면 됩니다.
    n = db.query(Notice).filter(Notice.id == notice_id).first()
    
    if not n:
        raise HTTPException(status_code=404, detail="Not found") # ★ 이제 에러 안 남
    
    return {
        "id": n.id,
        "title": n.title,
        "content_html": n.content_html,
        "posted_date": str(n.posted_date),
        "target_grade": n.target_grade,
        "original_filename": n.original_filename,
        "file_path": n.file_path,
        "source": n.source # 소스 정보 추가 (프론트에서 파일 경로 분기용)
    }