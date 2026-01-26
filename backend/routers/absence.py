# backend/routers/absence.py
import os
import shutil
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, Form
from sqlalchemy.orm import Session
from deps import get_db, get_current_user
from models import AbsenceRequest, AbsenceAttachment, User

r = APIRouter(prefix="/absence", tags=["absence"])
UPLOAD_DIR = "uploads/absence"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@r.post("")
def create_absence(
    target_date: str = Form(...),
    subject: str = Form(...),
    reason: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 공결 신청 저장
    new_absence = AbsenceRequest(
        # ★ 수정: 모델의 student_id 컬럼에 로그인한 유저 ID 저장
        student_id=current_user.id,  
        
        absent_date=target_date,
        course_name=subject,
        reason=reason,
        status="SUBMITTED"
    )
    db.add(new_absence)
    db.commit()
    db.refresh(new_absence)

    # 파일 저장 (이후 코드는 동일)
    file_ext = os.path.splitext(file.filename)[1]
    stored_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_attachment = AbsenceAttachment(
        request_id=new_absence.id,
        original_name=file.filename,
        stored_name=stored_filename,
        mime=file.content_type,
        size=0
    )
    db.add(new_attachment)
    db.commit()

    return new_absence

@r.get("/me")
def get_my_absences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # ★ 수정: student_id로 조회
    return db.query(AbsenceRequest).filter(AbsenceRequest.student_id == current_user.id).order_by(AbsenceRequest.id.desc()).all()