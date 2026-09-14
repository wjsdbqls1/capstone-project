from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from deps import get_db
from models import Notification

r = APIRouter(prefix="/notifications", tags=["notifications"])

# 오래된 기록까지 전부 내려주면 목록이 갈수록 무거워진다.
# 최근 것만 보면 충분하므로 상한을 둔다.
DEFAULT_LIMIT = 50
MAX_LIMIT = 200


@r.get("")
def my_notifications(limit: int = DEFAULT_LIMIT, u=Depends(get_current_user), db: Session = Depends(get_db)):
    limit = max(1, min(limit, MAX_LIMIT))
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == u.id)
        .order_by(Notification.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "url": n.url,
            "is_read": bool(n.is_read),
            "created_at": n.created_at,
        }
        for n in rows
    ]


@r.get("/unread-count")
def unread_count(u=Depends(get_current_user), db: Session = Depends(get_db)):
    count = (
        db.query(Notification)
        .filter(Notification.user_id == u.id, Notification.is_read == 0)
        .count()
    )
    return {"count": count}


@r.post("/{notification_id}/read")
def mark_read(notification_id: int, u=Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="not found")
    # 남의 알림을 읽음 처리하지 못하게 막는다
    if n.user_id != u.id:
        raise HTTPException(status_code=403, detail="forbidden")
    n.is_read = 1
    db.commit()
    return {"ok": True}


@r.post("/read-all")
def mark_all_read(u=Depends(get_current_user), db: Session = Depends(get_db)):
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == u.id, Notification.is_read == 0)
        .update({Notification.is_read: 1}, synchronize_session=False)
    )
    db.commit()
    return {"ok": True, "updated": updated}
