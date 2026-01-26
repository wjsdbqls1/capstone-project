from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_assistant
from deps import get_db
from models import HandoverEvent

r = APIRouter(prefix="/admin/calendar", tags=["admin-calendar"])

def parse_dt(s: str) -> datetime:
    # 입력 예: "2026-01-20 14:00"
    try:
        return datetime.strptime(s, "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="datetime format must be YYYY-MM-DD HH:MM")

class EventCreateIn(BaseModel):
    title: str
    start_at: str
    end_at: str
    location: str | None = None
    memo: str | None = None

@r.post("")
def create_event(data: EventCreateIn, a=Depends(require_assistant), db: Session = Depends(get_db)):
    start = parse_dt(data.start_at)
    end = parse_dt(data.end_at)
    if end <= start:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")

    e = HandoverEvent(
        author_id=a.id,
        title=data.title,
        start_at=start,
        end_at=end,
        location=data.location,
        memo=data.memo,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"id": e.id}

@r.get("")
def list_events(
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
    from_date: str | None = None,  # "2026-01-01"
    to_date: str | None = None,    # "2026-01-31"
):
    q = db.query(HandoverEvent)

    if from_date:
        d = datetime.strptime(from_date, "%Y-%m-%d")
        q = q.filter(HandoverEvent.start_at >= d)

    if to_date:
        d = datetime.strptime(to_date, "%Y-%m-%d")
        q = q.filter(HandoverEvent.start_at < d.replace(hour=23, minute=59, second=59))

    rows = q.order_by(HandoverEvent.start_at.asc(), HandoverEvent.id.asc()).all()
    return [
        {
            "id": x.id,
            "title": x.title,
            "start_at": str(x.start_at),
            "end_at": str(x.end_at),
            "location": x.location,
        }
        for x in rows
    ]

@r.get("/{event_id}")
def event_detail(event_id: int, _=Depends(require_assistant), db: Session = Depends(get_db)):
    x = db.query(HandoverEvent).filter(HandoverEvent.id == event_id).first()
    if not x:
        raise HTTPException(status_code=404, detail="event not found")
    return {
        "id": x.id,
        "title": x.title,
        "start_at": str(x.start_at),
        "end_at": str(x.end_at),
        "location": x.location,
        "memo": x.memo,
    }

class EventUpdateIn(BaseModel):
    title: str | None = None
    start_at: str | None = None
    end_at: str | None = None
    location: str | None = None
    memo: str | None = None

@r.patch("/{event_id}")
def update_event(event_id: int, data: EventUpdateIn, _=Depends(require_assistant), db: Session = Depends(get_db)):
    x = db.query(HandoverEvent).filter(HandoverEvent.id == event_id).first()
    if not x:
        raise HTTPException(status_code=404, detail="event not found")

    if data.title is not None:
        x.title = data.title
    if data.start_at is not None:
        x.start_at = parse_dt(data.start_at)
    if data.end_at is not None:
        x.end_at = parse_dt(data.end_at)
    if x.end_at <= x.start_at:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")

    if data.location is not None:
        x.location = data.location
    if data.memo is not None:
        x.memo = data.memo

    db.commit()
    return {"ok": True}

@r.delete("/{event_id}")
def delete_event(event_id: int, _=Depends(require_assistant), db: Session = Depends(get_db)):
    x = db.query(HandoverEvent).filter(HandoverEvent.id == event_id).first()
    if not x:
        raise HTTPException(status_code=404, detail="event not found")
    db.delete(x)
    db.commit()
    return {"ok": True}
