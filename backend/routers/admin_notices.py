# backend/routers/admin_notices.py
import os
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from deps import get_db
from auth import require_assistant
from models import Notice, User
from push_service import send_push_to_users
from upload_utils import save_upload

r = APIRouter(prefix="/admin/notices", tags=["admin-notices"])

UPLOAD_DIR = "uploads/notices"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. 공지사항 등록 (파일 업로드 포함)
@r.post("")
def create_notice(
    title: str = Form(...),
    content_html: str = Form(...),
    target_grade: int = Form(0),
    file: Optional[UploadFile] = File(None), # 파일은 선택사항
    db: Session = Depends(get_db),
    current_user: User = Depends(require_assistant)
):
    saved_filename = None
    original_filename = None

    # 파일이 있으면 저장
    if file:
        saved_filename = save_upload(file, UPLOAD_DIR)
        original_filename = file.filename

    new_notice = Notice(
        title=title,
        content_html=content_html,
        target_grade=target_grade,
        posted_date=date.today(),
        author_id=current_user.id,
        file_path=saved_filename,       # ★ 저장
        original_filename=original_filename # ★ 저장
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)

    q = db.query(User).filter(User.role == "student")
    if new_notice.target_grade != 0:
        q = q.filter(User.grade == new_notice.target_grade)
    send_push_to_users(
        db, [u.id for u in q.all()],
        title="새 공지사항",
        body=new_notice.title,
        url="/student/notice",
    )

    return new_notice

# 2. 수정 (간단하게 구현: 새 파일 올리면 교체, 안 올리면 유지)
@r.put("/{notice_id}")
def update_notice(
    notice_id: int,
    title: str = Form(...),
    content_html: str = Form(...),
    target_grade: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_assistant)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="notice not found")
    
    notice.title = title
    notice.content_html = content_html
    notice.target_grade = target_grade

    # 새 파일이 들어오면 기존 파일 정보 덮어쓰기 (기존 파일 삭제는 생략함)
    if file:
        notice.file_path = save_upload(file, UPLOAD_DIR)
        notice.original_filename = file.filename

    db.commit()

    q = db.query(User).filter(User.role == "student")
    if notice.target_grade != 0:
        q = q.filter(User.grade == notice.target_grade)
    send_push_to_users(
        db, [u.id for u in q.all()],
        title="공지사항 수정",
        body=notice.title,
        url="/student/notice",
    )

    return {"message": "updated"}

# 3. 삭제
@r.delete("/{notice_id}")
def delete_notice(notice_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_assistant)):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="notice not found")

    # (선택) 실제 파일도 삭제하고 싶다면 여기서 os.remove 사용

    db.delete(notice)
    db.commit()
    return {"message": "deleted"}


# 4. 외부 공지 크롤링 (서버에서 실행 → 첨부파일을 서버 디스크에 저장)
import threading
import importlib.util

_crawl_state = {"running": False, "last_result": None}


@r.post("/sync-external")
def sync_external_notices_endpoint(reset: bool = False, max_pages: int = 5, current_user: User = Depends(require_assistant)):
    """학과 홈페이지 외부 공지를 서버에서 크롤링하여 첨부파일까지 서버에 저장.

    reset=true 이면 기존 external 공지를 삭제 후 재크롤링(첨부파일 서버에 재저장).
    max_pages 로 크롤링 페이지 수를 제한(기본 5페이지).
    """
    if _crawl_state["running"]:
        return {"message": "이미 크롤링이 진행 중입니다.", "running": True}

    def run():
        _crawl_state["running"] = True
        try:
            script_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "scripts", "sync_external_notices.py"
            )
            spec = importlib.util.spec_from_file_location("sync_external_notices", script_path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            count = mod.main(max_pages=max_pages, reset=reset)
            _crawl_state["last_result"] = f"신규 {count}건"
        except Exception as e:
            _crawl_state["last_result"] = f"오류: {e}"
            print("[sync-external] 크롤링 오류:", e)
        finally:
            _crawl_state["running"] = False

    threading.Thread(target=run, daemon=True).start()
    return {"message": "외부 공지 크롤링을 백그라운드에서 시작했습니다.", "reset": reset, "max_pages": max_pages}


@r.get("/sync-external/status")
def sync_external_status():
    return _crawl_state