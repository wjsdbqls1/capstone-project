# backend/routers/push.py
import os

from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from deps import get_db
from models import PushSubscription
from push_service import NOTIFY_ONLY_USER_IDS

load_dotenv()

r = APIRouter(prefix="/push", tags=["push"])

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class SubscriptionIn(BaseModel):
    endpoint: str
    keys: SubscriptionKeys


class UnsubscribeIn(BaseModel):
    endpoint: str


@r.get("/vapid-public-key")
def get_vapid_public_key():
    return {"publicKey": VAPID_PUBLIC_KEY}


# 시연 모드가 운영 서버에 실제로 켜졌는지 확인용(개발자 전용). 시연 정리 때 함께 회수할 것.
@r.get("/notify-mode")
def notify_mode(_=Depends(require_admin)):
    return {"notify_only_user_ids": sorted(NOTIFY_ONLY_USER_IDS)}


@r.post("/subscribe")
def subscribe(
    data: SubscriptionIn,
    u=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == data.endpoint).first()
    if existing:
        existing.user_id = u.id
        existing.p256dh = data.keys.p256dh
        existing.auth = data.keys.auth
    else:
        db.add(PushSubscription(
            user_id=u.id,
            endpoint=data.endpoint,
            p256dh=data.keys.p256dh,
            auth=data.keys.auth,
        ))
    db.commit()
    return {"ok": True}


@r.post("/unsubscribe")
def unsubscribe(
    data: UnsubscribeIn,
    u=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == data.endpoint,
        PushSubscription.user_id == u.id,
    ).delete()
    db.commit()
    return {"ok": True}
