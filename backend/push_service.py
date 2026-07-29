# backend/push_service.py
import json
import os

from dotenv import load_dotenv
from py_vapid import Vapid01
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from models import PushSubscription

load_dotenv()

_VAPID_PRIVATE_KEY_PEM = os.getenv("VAPID_PRIVATE_KEY", "").replace("\\n", "\n")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL", "mailto:admin@example.com")

# pywebpush의 Vapid.from_string()은 PEM 헤더를 제거하지 않고 그대로 base64
# 디코딩을 시도해 깨지므로, PEM을 직접 파싱한 Vapid01 인스턴스를 넘겨준다.
_vapid = Vapid01.from_pem(_VAPID_PRIVATE_KEY_PEM.encode()) if _VAPID_PRIVATE_KEY_PEM else None


def send_push_to_user(db: Session, user_id: int, title: str, body: str, url: str = "/"):
    if not _vapid:
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
                vapid_private_key=_vapid,
                vapid_claims={"sub": VAPID_CLAIM_EMAIL},
            )
        except WebPushException as e:
            status = e.response.status_code if e.response is not None else None
            if status in (404, 410):
                db.query(PushSubscription).filter(PushSubscription.id == sub.id).delete()
                db.commit()
        except Exception as e:
            # 푸시 발송 실패가 문의답변/공결처리 같은 본 기능을 막지 않도록 방어
            print(f"⚠️ [push] 알림 발송 실패: {e}")


def send_push_to_users(db: Session, user_ids, title: str, body: str, url: str = "/"):
    for uid in user_ids:
        send_push_to_user(db, uid, title, body, url)
