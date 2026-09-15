# backend/routers/faqs.py
import os
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from deps import get_db
from auth import get_current_user, require_assistant
from models import FAQ, User
from push_service import send_push_to_users
from upload_utils import attachments_json, collect_files, parse_attachments, save_uploads

r = APIRouter(prefix="/faqs", tags=["faqs"])

# 파일 저장 폴더 설정
UPLOAD_DIR = "uploads/faqs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _serialize(f: FAQ) -> dict:
    """ORM 객체를 그대로 돌려주면 attachments가 JSON 문자열로 나가므로 목록으로 풀어서 내려준다."""
    legacy = f"/uploads/faqs/{f.file_path}" if f.file_path else None
    return {
        "id": f.id,
        "question": f.question,
        "answer_html": f.answer_html,
        "posted_date": f.posted_date,
        "author_id": f.author_id,
        "category": f.category,
        "file_path": f.file_path,
        "original_filename": f.original_filename,
        "attachments": parse_attachments(f.attachments, legacy, f.original_filename),
        "created_at": f.created_at,
        "updated_at": f.updated_at,
    }

# 1. 목록 조회
@r.get("")
def list_faqs(_=Depends(get_current_user), db: Session = Depends(get_db)):
    # 등록일(created_at) 내림차순 정렬, 동일 등록일은 최신 등록 순(id)으로
    rows = db.query(FAQ).order_by(FAQ.created_at.desc(), FAQ.id.desc()).all()
    return [_serialize(f) for f in rows]

VALID_CATEGORIES = ['수강신청', '성적', '졸업', '장학금', '휴복학', '등록금', '기숙사', '공결_출석', '증명서', '기타']

# 2. FAQ 등록 (파일 포함)
@r.post("")
def create_faq(
    question: str = Form(...),
    answer_html: str = Form(...),
    category: str = Form("기타"),
    file: Optional[UploadFile] = File(None),
    files: list[UploadFile] = File([]),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_assistant)
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 카테고리입니다. 허용값: {VALID_CATEGORIES}")

    items = save_uploads(collect_files(file, files), UPLOAD_DIR)
    # 옛 앱은 file_path/original_filename 하나만 읽으므로 첫 파일을 거기에도 넣어 둔다
    saved_filename = items[0]["url"].rsplit("/", 1)[-1] if items else None
    original_filename = items[0]["name"] if items else None

    new_faq = FAQ(
        question=question,
        answer_html=answer_html,
        posted_date=date.today(),
        author_id=current_user.id,
        category=category,
        file_path=saved_filename,
        original_filename=original_filename,
        attachments=attachments_json(items),
    )
    db.add(new_faq)
    db.commit()
    db.refresh(new_faq)

    student_ids = [u.id for u in db.query(User).filter(User.role == "student").all()]
    background_tasks.add_task(
        send_push_to_users, student_ids,
        title="새 FAQ 등록",
        body=new_faq.question,
        url="/student/faq",
    )

    return _serialize(new_faq)

# 3. FAQ 수정
@r.put("/{faq_id}")
def update_faq(
    faq_id: int,
    question: str = Form(...),
    answer_html: str = Form(...),
    category: str = Form("기타"),
    file: Optional[UploadFile] = File(None),
    files: list[UploadFile] = File([]),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_assistant)
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
    items = save_uploads(collect_files(file, files), UPLOAD_DIR)
    if items:
        faq.file_path = items[0]["url"].rsplit("/", 1)[-1]
        faq.original_filename = items[0]["name"]
        faq.attachments = attachments_json(items)

    db.commit()

    student_ids = [u.id for u in db.query(User).filter(User.role == "student").all()]
    background_tasks.add_task(
        send_push_to_users, student_ids,
        title="FAQ 수정",
        body=faq.question,
        url="/student/faq",
    )

    return {"message": "updated"}

# 4. 삭제
@r.delete("/{faq_id}")
def delete_faq(faq_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_assistant)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    db.delete(faq)
    db.commit()
    return {"message": "deleted"}