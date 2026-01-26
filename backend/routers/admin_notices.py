# backend/routers/admin_notices.py
import os
import shutil
import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from deps import get_db
from models import Notice

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
    db: Session = Depends(get_db)
):
    saved_filename = None
    original_filename = None

    # 파일이 있으면 저장
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        saved_filename = f"{uuid.uuid4()}{file_ext}" # 중복 방지 랜덤 이름
        file_path = os.path.join(UPLOAD_DIR, saved_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        original_filename = file.filename

    new_notice = Notice(
        title=title,
        content_html=content_html,
        target_grade=target_grade,
        posted_date=date.today(),
        author_id=1,
        file_path=saved_filename,       # ★ 저장
        original_filename=original_filename # ★ 저장
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)
    return new_notice

# 2. 수정 (간단하게 구현: 새 파일 올리면 교체, 안 올리면 유지)
@r.put("/{notice_id}")
def update_notice(
    notice_id: int,
    title: str = Form(...),
    content_html: str = Form(...),
    target_grade: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="notice not found")
    
    notice.title = title
    notice.content_html = content_html
    notice.target_grade = target_grade

    # 새 파일이 들어오면 기존 파일 정보 덮어쓰기 (기존 파일 삭제는 생략함)
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        saved_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        notice.file_path = saved_filename
        notice.original_filename = file.filename
    
    db.commit()
    return {"message": "updated"}

# 3. 삭제
@r.delete("/{notice_id}")
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="notice not found")
    
    # (선택) 실제 파일도 삭제하고 싶다면 여기서 os.remove 사용
    
    db.delete(notice)
    db.commit()
    return {"message": "deleted"}