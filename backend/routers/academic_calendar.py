# backend/routers/academic_calendar.py
from datetime import date, datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db
from models import AcademicEvent

r = APIRouter(prefix="/academic-events", tags=["academic-events"])

class AcademicEventCreate(BaseModel):
    title: str
    start_date: str 
    end_date: str   

@r.get("")
def list_events(
    db: Session = Depends(get_db),
    year: int | None = None,
    month: int | None = None,
    q: str | None = None,
    limit: int = 200,
):
    y = year or date.today().year

    query = db.query(AcademicEvent).filter(AcademicEvent.year == y)

    if q:
        query = query.filter(AcademicEvent.title.contains(q))

    if month is not None:
        if not (1 <= month <= 12):
            raise HTTPException(status_code=400, detail="month must be 1~12")
        start_m = date(y, month, 1)
        if month == 12:
            next_m = date(y + 1, 1, 1)
        else:
            next_m = date(y, month + 1, 1)

        query = query.filter(AcademicEvent.start_date < next_m)
        query = query.filter(AcademicEvent.end_date >= start_m)

    rows = query.order_by(AcademicEvent.start_date.asc(), AcademicEvent.id.asc()).limit(limit).all()
    
    # ★ 수정된 부분: "source" 필드를 함께 반환하도록 추가
    return [
        {
            "id": x.id,
            "title": x.title,
            "start_date": str(x.start_date),
            "end_date": str(x.end_date),
            "source": x.source  # 프론트엔드에서 색상 구분을 위해 필요
        }
        for x in rows
    ]

@r.post("")
def create_academic_event(data: AcademicEventCreate, db: Session = Depends(get_db)):
    print(f"[DEBUG] Received event data: {data}")
    
    try:
        s_date = datetime.strptime(data.start_date, "%Y-%m-%d").date()
        e_date = datetime.strptime(data.end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")
    
    if e_date < s_date:
        raise HTTPException(status_code=400, detail="종료 날짜가 시작 날짜보다 빠를 수 없습니다.")

    generated_key = f"MANUAL|{s_date}|{uuid.uuid4().hex[:8]}"

    new_event = AcademicEvent(
        title=data.title,
        year=s_date.year,
        start_date=s_date,
        end_date=e_date,
        source="manual",       
        source_key=generated_key 
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    print(f"[SUCCESS] Event created: {new_event.id} ({new_event.title})")
    return {"id": new_event.id, "title": new_event.title}