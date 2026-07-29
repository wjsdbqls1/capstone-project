# backend/push_service.py
import json
import os

from dotenv import load_dotenv
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from models import PushSubscription

load_dotenv()

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "").replace("\\n", "\n")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL", "mailto:admin@example.com")


def send_push_to_user(db: Session, user_id: int, title: str, body: str, url: str = "/"):
    if not VAPID_PRIVATE_KEY:
        return

    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    payload = json.dumps({"title": title, "body": body, "url": url})

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_CLAIM_EMAIL},
            )
        except WebPushException as e:
            status = e.response.status_code if e.response is not None else None
            if status in (404, 410):
                db.query(PushSubscription).filter(PushSubscription.id == sub.id).delete()
                db.commit()
