# backend/routers/notices_detail.py
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

# from auth import get_current_user  <-- 제거
from deps import get_db
from models import Notice, ExternalNotice, ExternalNoticeFile

load_dotenv()
# 파일 저장 경로 (실제 경로에 맞게 환경변수나 기본값 설정)
EXT_NOTICE_DIR = os.getenv("EXT_NOTICE_DIR", r"C:\uploads\external_notices")

r = APIRouter(prefix="/notices", tags=["notices-detail"])

# 1. 내부 공지 상세 조회 (잠금 해제)
@r.get("/internal/{notice_id}")
def internal_notice_detail(notice_id: int, db: Session = Depends(get_db)):
    n = db.query(Notice).filter(Notice.id == notice_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="internal notice not found")
    return {
        "source": "internal",
        "id": n.id,
        "title": n.title,
        "content_html": n.content_html,
        "posted_date": str(n.posted_date),
        "author_id": n.author_id,
    }

# 2. 외부 공지 상세 조회 (잠금 해제)
@r.get("/external/{article_no}")
def external_notice_detail(article_no: str, db: Session = Depends(get_db)):
    e = db.query(ExternalNotice).filter(ExternalNotice.article_no == article_no).first()
    if not e:
        raise HTTPException(status_code=404, detail="external notice not found")
    return {
        "source": "external",
        "article_no": e.article_no,
        "title": e.title,
        "author": e.author,
        "posted_date": str(e.posted_date) if e.posted_date else None,
        "views": e.views,
        "content_html": e.content_html,
        "detail_url": e.detail_url,
    }

# 3. 외부 공지 첨부파일 목록 (잠금 해제)
@r.get("/external/{article_no}/files")
def external_notice_files(article_no: str, db: Session = Depends(get_db)):
    e = db.query(ExternalNotice).filter(ExternalNotice.article_no == article_no).first()
    if not e:
        raise HTTPException(status_code=404, detail="external notice not found")

    rows = (
        db.query(ExternalNoticeFile)
        .filter(ExternalNoticeFile.notice_id == e.id)
        .order_by(ExternalNoticeFile.id.asc())
        .all()
    )
    return [{"file_id": f.id, "original_name": f.original_name, "size": f.size} for f in rows]

# 4. 파일 다운로드 (잠금 해제)
@r.get("/external/files/{file_id}/download")
def download_external_notice_file(file_id: int, db: Session = Depends(get_db)):
    f = db.query(ExternalNoticeFile).filter(ExternalNoticeFile.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="file not found")

    path = os.path.join(EXT_NOTICE_DIR, f.stored_name)
    
    # 파일이 실제로 없어도 에러 대신 안내 메시지를 주거나 처리
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="file missing on disk")

    return FileResponse(path, filename=f.original_name, media_type="application/octet-stream")