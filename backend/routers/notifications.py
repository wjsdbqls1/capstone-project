from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from deps import get_db
from models import Notification

r = APIRouter(prefix="/notifications", tags=["notifications"])

@r.get("")
def my_notifications(u=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == u.id)
        .order_by(Notification.id.desc())
        .all()
    )
    return [{"id": n.id, "message": n.message, "is_read": n.is_read} for n in rows]
