import os
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from auth import get_current_user
from deps import get_db
from models import Attachment, Inquiry

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

r = APIRouter(tags=["attachments"])

@r.post("/inquiries/{inquiry_id}/attachments")
async def upload_attachment(
    inquiry_id: int,
    f: UploadFile = File(...),
    u=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="inquiry not found")

    if u.role not in ("assistant", "admin") and q.user_id != u.id:
        raise HTTPException(status_code=403, detail="forbidden")

    ext = os.path.splitext(f.filename or "")[1]
    stored = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, stored)

    data = await f.read()
    with open(path, "wb") as out:
        out.write(data)

    a = Attachment(
        inquiry_id=inquiry_id,
        original_name=f.filename or stored,
        stored_name=stored,
        mime=f.content_type,
        size=len(data),
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"attachment_id": a.id}

@r.get("/inquiries/{inquiry_id}/attachments")
def list_attachments(
    inquiry_id: int,
    u=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="inquiry not found")

    if u.role not in ("assistant", "admin") and q.user_id != u.id:
        raise HTTPException(status_code=403, detail="forbidden")

    rows = db.query(Attachment).filter(Attachment.inquiry_id == inquiry_id).order_by(Attachment.id.asc()).all()
    return [{"id": x.id, "original_name": x.original_name, "size": x.size, "mime": x.mime} for x in rows]

@r.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    u=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    a = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="attachment not found")

    q = db.query(Inquiry).filter(Inquiry.id == a.inquiry_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="inquiry not found")

    if u.role not in ("assistant", "admin") and q.user_id != u.id:
        raise HTTPException(status_code=403, detail="forbidden")

    path = os.path.join(UPLOAD_DIR, a.stored_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="file missing on disk")

    return FileResponse(path, filename=a.original_name, media_type=a.mime or "application/octet-stream")
