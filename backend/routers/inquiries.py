# backend/routers/inquiries.py
import os
import uuid
import shutil
from typing import Optional
from sqlalchemy.orm import Session, joinedload 
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from deps import get_db, get_current_user
from models import Inquiry, InquiryReply, InquiryHistory, AcademicEvent, User

r = APIRouter(prefix="/inquiries", tags=["inquiries"])

UPLOAD_DIR = "uploads"

# ★ 파일 저장 헬퍼 함수
def save_upload_file(file: UploadFile) -> str:
    if not file:
        return None
    # 파일명 중복 방지를 위해 UUID 사용
    file_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # DB에 저장할 접근 URL
    return f"/uploads/{file_name}"

# 1. 문의 등록
@r.post("")
def create_inquiry(
    title: str = Form(...),
    content: str = Form(...),
    academic_event_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachment_url = save_upload_file(file)

    q = Inquiry(
        user_id=current_user.id,
        title=title,
        content=content,
        status="OPEN",
        academic_event_id=academic_event_id,
        attachment=attachment_url
    )
    db.add(q)
    db.commit()
    return {"message": "registered"}

# 2. 내 문의 목록 조회
@r.get("/me")
def list_my_inquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rows = db.query(Inquiry).filter(Inquiry.user_id == current_user.id).order_by(Inquiry.id.desc()).all()
    return rows

# 3. 조교용 목록 조회
@r.get("")
def list_all_inquiries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # (1) DB에서 문의글 가져오기 (작성자 정보와 학사일정 정보를 미리 같이 로딩) 
    inquiries = db.query(Inquiry)\
        .options(
            joinedload(Inquiry.user),           # 작성자 정보 로딩
            joinedload(Inquiry.academic_event)  # 학사일정 정보 로딩
        )\
        .order_by(Inquiry.id.desc())\
        .all()

    # (2) 프론트엔드가 원하는 형태로 데이터 가공
    results = []
    for q in inquiries:
        # 작성자 정보 추출
        author_info = None
        if q.user:
            author_info = {
                "name": q.user.name,
                "student_no": q.user.student_no,
                "department": q.user.department,
                "grade": q.user.grade
            }
        
        # 학사일정 정보 추출
        event_info = None
        if q.academic_event:
            event_info = {
                "title": q.academic_event.title,
                "end_date": str(q.academic_event.end_date)
            }

        # 결과 리스트에 추가
        results.append({
            "id": q.id,
            "title": q.title,
            "content": q.content,
            "status": q.status,
            "created_at": q.created_at,
            "user_id": q.user_id,
            "attachment": q.attachment,
            "academic_event_id": q.academic_event_id,
            "author_info": author_info, 
            "academic_event": event_info
        })

    return results

# 4. 상세 조회
@r.get("/{inquiry_id}")
def inquiry_detail(inquiry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="not found")
    
    # 작성자 정보
    author = db.query(User).filter(User.id == q.user_id).first()
    
    # 학사일정 정보
    ev = None
    if q.academic_event_id:
        ev_row = db.query(AcademicEvent).filter(AcademicEvent.id == q.academic_event_id).first()
        if ev_row: ev = {"title": ev_row.title, "end_date": str(ev_row.end_date)}

    return {
        "id": q.id,
        "title": q.title,
        "content": q.content,
        "status": q.status,
        "attachment": q.attachment,
        "created_at": q.created_at,
        "author_name": author.name if author else "알수없음",
        "author_info": {"student_no": author.student_no, "name": author.name, "department": author.department, "grade": author.grade} if author else {},
        "academic_event": ev,
        "academic_event_id": q.academic_event_id
    }

# 5. 답변 목록 조회
@r.get("/{inquiry_id}/replies")
def inquiry_replies(inquiry_id: int, db: Session = Depends(get_db)):
    return db.query(InquiryReply).filter(InquiryReply.inquiry_id == inquiry_id).all()

# 6. 답변 등록
@r.post("/{inquiry_id}/replies")
def create_reply(
    inquiry_id: int,
    content: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="not found")
    
    attachment_url = save_upload_file(file)

    new_reply = InquiryReply(
        inquiry_id=inquiry_id,
        assistant_id=current_user.id,
        content=content,
        attachment=attachment_url
    )
    db.add(new_reply)
    q.status = "COMPLETED" # 답변 달리면 완료 상태로 변경
    
    db.commit()
    return {"message": "reply created"}

# ★ 7. 답변 수정 (새로 추가됨)
@r.put("/{inquiry_id}/replies/{reply_id}")
def update_reply(
    inquiry_id: int,
    reply_id: int,
    content: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 수정할 답변 찾기
    reply = db.query(InquiryReply).filter(InquiryReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    # 권한 확인 (본인이 작성한 답변인지)
    if reply.assistant_id != current_user.id:
         raise HTTPException(status_code=403, detail="Permission denied")

    # 내용 업데이트
    reply.content = content
    
    # 새 파일이 업로드된 경우에만 교체
    if file:
        attachment_url = save_upload_file(file)
        reply.attachment = attachment_url
        
    # models.py에서 onupdate=func.now() 설정이 되어 있다면
    # commit 시 자동으로 updated_at이 갱신됩니다.
    
    db.commit()
    return {"message": "updated"}