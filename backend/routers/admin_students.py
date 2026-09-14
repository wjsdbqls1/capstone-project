# backend/routers/admin_students.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext

from auth import require_admin, require_assistant
from deps import get_db
from models import (
    AbsenceRequest,
    CalendarMemo,
    Inquiry,
    InquiryReply,
    Notification,
    PushSubscription,
    User,
)

r = APIRouter(prefix="/admin/students", tags=["admin-students"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

VALID_STATUS = ("재학", "휴학", "졸업")


def _serialize(u: User):
    return {
        "id": u.id,
        "student_no": u.student_no,
        "name": u.name,
        "department": u.department,
        "grade": u.grade,
        "status": u.status,
        "created_at": str(u.created_at) if u.created_at else None,
    }


class StudentCreateIn(BaseModel):
    student_no: str
    name: str
    department: str | None = None
    grade: int | None = None  # 1~4


class StudentUpdateIn(BaseModel):
    # 상태 변경 (학년/휴학/졸업). grade는 status가 '재학'일 때만 의미 있음.
    status: str | None = None      # 재학/휴학/졸업
    grade: int | None = None       # 1~4
    name: str | None = None
    department: str | None = None


@r.get("")
def list_students(
    search: str | None = None,
    status: str | None = None,
    grade: int | None = None,
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
):
    q = db.query(User).filter(User.role == "student")

    if search:
        like = f"%{search}%"
        q = q.filter(or_(User.name.ilike(like), User.student_no.ilike(like)))
    if status:
        q = q.filter(User.status == status)
    if grade is not None:
        q = q.filter(User.grade == grade)

    rows = q.order_by(User.grade.desc().nullslast(), User.student_no.asc()).all()
    return [_serialize(u) for u in rows]


@r.post("")
def create_student(
    data: StudentCreateIn,
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
):
    exists = db.query(User).filter(User.student_no == data.student_no).first()
    if exists:
        raise HTTPException(status_code=409, detail="이미 존재하는 학번입니다.")

    if data.grade is not None and data.grade not in (1, 2, 3, 4):
        raise HTTPException(status_code=400, detail="학년은 1~4만 가능합니다.")

    # 초기 비밀번호 = 학번 + "!"
    init_password = f"{data.student_no}!"

    u = User(
        student_no=data.student_no,
        name=data.name,
        department=data.department,
        grade=data.grade,
        role="student",
        status="재학",
        password_hash=pwd.hash(init_password),
        must_change_password=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return {**_serialize(u), "init_password": init_password}


@r.patch("/{student_id}")
def update_student(
    student_id: int,
    data: StudentUpdateIn,
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
):
    u = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not u:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    if data.status is not None:
        if data.status not in VALID_STATUS:
            raise HTTPException(status_code=400, detail="유효하지 않은 상태입니다.")
        u.status = data.status

    if data.grade is not None:
        if data.grade not in (1, 2, 3, 4):
            raise HTTPException(status_code=400, detail="학년은 1~4만 가능합니다.")
        u.grade = data.grade

    if data.name is not None:
        u.name = data.name
    if data.department is not None:
        u.department = data.department

    db.commit()
    db.refresh(u)
    return _serialize(u)


@r.post("/{student_id}/reset-password")
def reset_password(
    student_id: int,
    _=Depends(require_admin),   # 조교가 아니라 개발자(admin)만 초기화할 수 있다
    db: Session = Depends(get_db),
):
    u = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not u:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    # 초기 비밀번호(학번 + "!")로 초기화
    init_password = f"{u.student_no}!"
    u.password_hash = pwd.hash(init_password)
    u.must_change_password = True
    db.commit()
    return {"id": u.id, "student_no": u.student_no, "init_password": init_password}


@r.delete("/{student_id}")
def delete_student(
    student_id: int,
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
):
    u = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not u:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다.")

    # 문의·공결은 남아 있어야 할 기록이라 계정만 조용히 지우면 안 된다.
    # 이런 학생은 삭제가 아니라 '졸업'으로 상태를 바꾸는 게 맞다.
    blockers = []
    if db.query(Inquiry).filter(Inquiry.user_id == u.id).first():
        blockers.append("문의")
    if db.query(InquiryReply).filter(InquiryReply.assistant_id == u.id).first():
        blockers.append("추가 질문")
    if db.query(AbsenceRequest).filter(AbsenceRequest.student_id == u.id).first():
        blockers.append("공결 신청")
    if blockers:
        raise HTTPException(
            status_code=409,
            detail=f"{', '.join(blockers)} 기록이 있어 삭제할 수 없습니다. 상태를 '졸업'으로 변경해 주세요.",
        )

    # 그 학생에게만 딸린 부수 데이터는 같이 지운다.
    # 남겨두면 외래키 제약에 걸려 삭제 자체가 실패한다(공지 하나만 올라가도
    # 전교생에게 알림이 생기므로, 정리하지 않으면 사실상 아무도 못 지운다).
    db.query(Notification).filter(Notification.user_id == u.id).delete(synchronize_session=False)
    db.query(PushSubscription).filter(PushSubscription.user_id == u.id).delete(synchronize_session=False)
    db.query(CalendarMemo).filter(CalendarMemo.user_id == u.id).delete(synchronize_session=False)

    db.delete(u)
    db.commit()
    return {"ok": True, "id": student_id}
