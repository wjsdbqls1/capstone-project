# backend/routers/faqs.py
import os
import shutil
import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from deps import get_db
from models import FAQ

r = APIRouter(prefix="/faqs", tags=["faqs"])

# 파일 저장 폴더 설정
UPLOAD_DIR = "uploads/faqs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. 목록 조회
@r.get("")
def list_faqs(db: Session = Depends(get_db)):
    return db.query(FAQ).order_by(FAQ.id.desc()).all()

VALID_CATEGORIES = ['수강신청', '성적', '졸업', '장학금', '휴복학', '등록금', '기숙사', '공결_출석', '증명서', '기타']

# 2. FAQ 등록 (파일 포함)
@r.post("")
def create_faq(
    question: str = Form(...),
    answer_html: str = Form(...),
    category: str = Form("기타"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 카테고리입니다. 허용값: {VALID_CATEGORIES}")

    saved_filename = None
    original_filename = None

    if file:
        file_ext = os.path.splitext(file.filename)[1]
        saved_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        original_filename = file.filename

    new_faq = FAQ(
        question=question,
        answer_html=answer_html,
        posted_date=date.today(),
        author_id=1,
        category=category,
        file_path=saved_filename,
        original_filename=original_filename,
    )
    db.add(new_faq)
    db.commit()
    db.refresh(new_faq)
    return new_faq

# 3. FAQ 수정
@r.put("/{faq_id}")
def update_faq(
    faq_id: int,
    question: str = Form(...),
    answer_html: str = Form(...),
    category: str = Form("기타"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 카테고리입니다. 허용값: {VALID_CATEGORIES}")

    faq.question = question
    faq.answer_html = answer_html
    faq.category = category

    # 새 파일이 있으면 교체
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        saved_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        faq.file_path = saved_filename
        faq.original_filename = file.filename

    db.commit()
    return {"message": "updated"}

# 4. 삭제
@r.delete("/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    db.delete(faq)
    db.commit()
    return {"message": "deleted"}