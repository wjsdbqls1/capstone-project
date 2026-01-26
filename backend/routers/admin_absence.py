# backend/routers/admin_absence.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel

from deps import get_db, get_current_user
from models import AbsenceRequest, User, AbsenceHistory, AbsenceAttachment

router = APIRouter(prefix="/admin/absence", tags=["admin-absence"])

# 요청 데이터 검증을 위한 Pydantic 모델
class AbsenceStatusUpdate(BaseModel):
    status: str  # "APPROVED" or "REJECTED"
    reject_reason: Optional[str] = None

# 1. 공결 신청 목록 조회 (최신순)
@router.get("/list")
def get_absence_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    # 신청자(User)와 첨부파일(Attachments) 정보를 한 번에 가져옵니다 (Join)
    requests = db.query(AbsenceRequest).options(
        joinedload(AbsenceRequest.user),
        joinedload(AbsenceRequest.attachments)
    ).order_by(AbsenceRequest.created_at.desc()).all()

    results = []
    for req in requests:
        # 파일 정보 추출
        file_info = None
        if req.attachments:
            att = req.attachments[0]
            file_url = f"/uploads/absence/{att.stored_name}" if not att.stored_name.startswith("/") else att.stored_name
            
            file_info = {
                "original_name": att.original_name,
                "stored_name": att.stored_name,
                "url": file_url
            }

        # 신청자 정보 매핑
        student_data = {
            "student_no": req.user.student_no if req.user else "(알수없음)",
            "student_name": req.user.name if req.user else "(탈퇴한유저)",
            "department": req.user.department if req.user else "-",
            "grade": req.user.grade if req.user else 0,
        }

        results.append({
            "id": req.id,
            "student_no": student_data["student_no"],
            "student_name": student_data["student_name"],
            "department": student_data["department"],
            "grade": student_data["grade"],
            "course_name": req.course_name,
            "absent_date": str(req.absent_date),
            "reason": req.reason,
            "status": req.status,
            "reject_reason": req.reject_reason, # (선택사항) 관리자 화면에서도 볼 수 있게 추가
            "created_at": str(req.created_at.date()),
            "file": file_info
        })
    return results

# 2. 공결 승인/반려 처리
@router.put("/{request_id}/status")
def update_absence_status(
    request_id: int, 
    update_data: AbsenceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(AbsenceRequest).filter(AbsenceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="신청 내역을 찾을 수 없습니다.")

    req.status = update_data.status
    
    # ★ [추가된 부분] 반려 사유를 DB 컬럼에도 저장
    if update_data.status == "REJECTED":
        req.reject_reason = update_data.reject_reason
    else:
        req.reject_reason = None # 승인 시 기존 반려 사유가 있다면 초기화
    
    # 히스토리 저장 (기존 로직 유지)
    history_detail = update_data.status
    if update_data.status == "REJECTED" and update_data.reject_reason:
        history_detail = f"REJECTED: {update_data.reject_reason}"
    
    new_history = AbsenceHistory(
        request_id=req.id,
        actor_id=current_user.id,
        action="STATUS_CHANGED",
        detail=history_detail
    )
    db.add(new_history)
    db.commit()
    
    return {"message": "처리되었습니다.", "status": req.status}