from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_assistant
from deps import get_db
from models import Inquiry, Notification, InquiryReply, InquiryHistory
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from sqlalchemy import case

from datetime import date
from models import AcademicEvent


r = APIRouter(prefix="/admin", tags=["admin"])


from datetime import datetime, timedelta

@r.get("/inquiries")
def list_all_inquiries(
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
    status: str | None = None,
    sort: str = "oldest",          # calendar | latest | oldest
    has_reply: bool | None = None, # true | false
    limit: int = 50,
):
    today = date.today()

    q = (
        db.query(Inquiry, AcademicEvent)
        .outerjoin(AcademicEvent, Inquiry.academic_event_id == AcademicEvent.id)
        .options(joinedload(Inquiry.user))
    )

    if status:
        q = q.filter(Inquiry.status == status)

    if has_reply is not None:
        replied = db.query(InquiryReply.inquiry_id).distinct().subquery()
        if has_reply:
            q = q.filter(Inquiry.id.in_(replied))
        else:
            q = q.filter(~Inquiry.id.in_(replied))

    if sort == "calendar":
        null_last = case((Inquiry.academic_event_id == None, 1), else_=0)
        q = q.order_by(
            null_last.asc(),
            AcademicEvent.end_date.asc(),
            Inquiry.created_at.asc(),
            Inquiry.id.asc(),
        )
    elif sort == "latest":
        q = q.order_by(Inquiry.created_at.desc(), Inquiry.id.desc())
    else:
        q = q.order_by(Inquiry.created_at.asc(), Inquiry.id.asc())

    rows = q.limit(limit).all()

    res = []
    for inquiry, ev_row in rows:
        u = inquiry.user

        ev = None
        deadline = None
        d_day = None

        if ev_row is not None:
            deadline = ev_row.end_date
            d_day = (deadline - today).days
            ev = {
                "id": ev_row.id,
                "title": ev_row.title,
                "start_date": str(ev_row.start_date),
                "end_date": str(ev_row.end_date),
            }

        deadline_label = None
        if d_day is not None:
            if d_day < 0:
                deadline_label = f"마감 {abs(d_day)}일 지남"
            elif d_day == 0:
                deadline_label = "마감 오늘"
            else:
                deadline_label = f"마감 {d_day}일전"

        is_overdue = False
        is_due_today = False
        is_due_soon_1 = False
        is_due_soon_15 = False
        deadline_level = "NONE"  # NONE | D15 | D1 | TODAY | OVERDUE

        if d_day is not None:
            is_overdue = d_day < 0
            is_due_today = d_day == 0
            is_due_soon_1 = 0 <= d_day <= 1
            is_due_soon_15 = 0 <= d_day <= 15

            if is_overdue:
                deadline_level = "OVERDUE"
            elif is_due_today:
                deadline_level = "TODAY"
            elif is_due_soon_1:
                deadline_level = "D1"
            elif is_due_soon_15:
                deadline_level = "D15"

        res.append(
            {
                "id": inquiry.id,
                "title": inquiry.title,
                "status": inquiry.status,
                "created_at": str(inquiry.created_at),
                "academic_event_id": inquiry.academic_event_id,
                "type": "ACADEMIC" if inquiry.academic_event_id is not None else "NONE",

                "deadline": str(deadline) if deadline else None,
                "d_day": d_day,
                "deadline_label": deadline_label,
                "deadline_level": deadline_level,
                "deadline_flags": {
                    "is_overdue": is_overdue,
                    "is_due_today": is_due_today,
                    "is_due_soon_1": is_due_soon_1,
                    "is_due_soon_15": is_due_soon_15,
                },
                "academic_event": ev,

                "user": {
                    "id": u.id if u else None,
                    "student_no": getattr(u, "student_no", None),
                    "name": getattr(u, "name", None),
                    "department": getattr(u, "department", None),
                    "grade": getattr(u, "grade", None),
                },
            }
        )

    return res


class InquiryStatusIn(BaseModel):
    status: str  # "OPEN" / "IN_PROGRESS" / "DONE"


@r.patch("/inquiries/{inquiry_id}/status")
def update_inquiry_status(
    inquiry_id: int,
    data: InquiryStatusIn,
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
):
    q = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="inquiry not found")
    q.status = data.status
    db.add(InquiryHistory(inquiry_id=q.id, actor_id=_.id, action="STATUS_CHANGED", detail=data.status))
    db.commit()
    return {"id": q.id, "status": q.status}


class ReplyIn(BaseModel):
    content: str


@r.post("/inquiries/{inquiry_id}/reply")
def reply_inquiry(
    inquiry_id: int,
    data: ReplyIn,
    a=Depends(require_assistant),
    db: Session = Depends(get_db),
):
    q = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="inquiry not found")

    rep = InquiryReply(inquiry_id=q.id, assistant_id=a.id, content=data.content)
    db.add(rep)

    q.status = "DONE"

    db.add(InquiryHistory(inquiry_id=q.id, actor_id=a.id, action="REPLY_CREATED"))
    db.add(InquiryHistory(inquiry_id=q.id, actor_id=a.id, action="STATUS_CHANGED", detail="DONE"))

    db.add(Notification(user_id=q.user_id, message=f"문의 '{q.title}'에 답변이 등록되었습니다."))

    db.commit()
    db.refresh(rep)
    return {"reply_id": rep.id, "inquiry_id": q.id, "status": q.status}
