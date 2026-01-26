from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_assistant
from deps import get_db
from models import HandoverNote

r = APIRouter(prefix="/admin/handover-notes", tags=["admin-handover"])

class NoteCreateIn(BaseModel):
    title: str
    content: str
    priority: int = 3  # 1~5

@r.post("")
def create_note(data: NoteCreateIn, a=Depends(require_assistant), db: Session = Depends(get_db)):
    if not (1 <= data.priority <= 5):
        raise HTTPException(status_code=400, detail="priority must be 1~5")

    n = HandoverNote(
        author_id=a.id,
        title=data.title,
        content=data.content,
        priority=data.priority,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return {"id": n.id}

@r.get("")
def list_notes(
    _=Depends(require_assistant),
    db: Session = Depends(get_db),
    q: str | None = None,
    sort: str = "latest",  # latest | priority
    limit: int = 50,
):
    query = db.query(HandoverNote)

    if q:
        query = query.filter(HandoverNote.title.contains(q))

    if sort == "priority":
        query = query.order_by(HandoverNote.priority.asc(), HandoverNote.id.desc())
    else:
        query = query.order_by(HandoverNote.id.desc())

    rows = query.limit(limit).all()
    return [
        {
            "id": x.id,
            "title": x.title,
            "priority": x.priority,
            "created_at": str(x.created_at),
        }
        for x in rows
    ]

@r.get("/{note_id}")
def note_detail(note_id: int, _=Depends(require_assistant), db: Session = Depends(get_db)):
    x = db.query(HandoverNote).filter(HandoverNote.id == note_id).first()
    if not x:
        raise HTTPException(status_code=404, detail="note not found")
    return {
        "id": x.id,
        "title": x.title,
        "content": x.content,
        "priority": x.priority,
        "created_at": str(x.created_at),
        "updated_at": str(x.updated_at) if x.updated_at else None,
    }

class NoteUpdateIn(BaseModel):
    title: str | None = None
    content: str | None = None
    priority: int | None = None

@r.patch("/{note_id}")
def update_note(note_id: int, data: NoteUpdateIn, _=Depends(require_assistant), db: Session = Depends(get_db)):
    x = db.query(HandoverNote).filter(HandoverNote.id == note_id).first()
    if not x:
        raise HTTPException(status_code=404, detail="note not found")

    if data.priority is not None and not (1 <= data.priority <= 5):
        raise HTTPException(status_code=400, detail="priority must be 1~5")

    if data.title is not None:
        x.title = data.title
    if data.content is not None:
        x.content = data.content
    if data.priority is not None:
        x.priority = data.priority

    db.commit()
    return {"ok": True}

@r.delete("/{note_id}")
def delete_note(note_id: int, _=Depends(require_assistant), db: Session = Depends(get_db)):
    x = db.query(HandoverNote).filter(HandoverNote.id == note_id).first()
    if not x:
        raise HTTPException(status_code=404, detail="note not found")
    db.delete(x)
    db.commit()
    return {"ok": True}
