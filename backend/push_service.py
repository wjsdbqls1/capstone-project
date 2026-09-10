# backend/push_service.py
import json
import os

from dotenv import load_dotenv
from py_vapid import Vapid01
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session

from db import SessionLocal
from models import PushSubscription, User

load_dotenv()

_VAPID_PRIVATE_KEY_PEM = os.getenv("VAPID_PRIVATE_KEY", "").replace("\\n", "\n")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL", "mailto:admin@example.com")

# pywebpush의 Vapid.from_string()은 PEM 헤더를 제거하지 않고 그대로 base64
# 디코딩을 시도해 깨지므로, PEM을 직접 파싱한 Vapid01 인스턴스를 넘겨준다.
_vapid = Vapid01.from_pem(_VAPID_PRIVATE_KEY_PEM.encode()) if _VAPID_PRIVATE_KEY_PEM else None


def _send_to_subscriptions(db: Session, subs: list[PushSubscription], title: str, body: str, url: str):
    """구독 목록에 실제로 webpush를 쏘는 내부 헬퍼.
    각 요청이 외부 푸시 서비스로 나가는 블로킹 네트워크 호출이라 느릴 수 있으므로,
    이 함수는 항상 백그라운드 태스크로만 호출해야 함(요청-응답 경로를 막지 않도록)."""
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


# ★ 아래 세 함수는 요청 처리 중 직접 호출하지 말고 항상
#   background_tasks.add_task(send_push_to_..., ...) 로만 호출할 것.
# 요청에서 쓰던 DB 세션을 재사용하지 않고 함수 안에서 새로 열고 닫는다
# (요청이 끝나면 그 세션은 닫혀버리므로, 백그라운드에서는 반드시 새 세션이 필요함).

def send_push_to_user(user_id: int, title: str, body: str, url: str = "/"):
    if not _vapid:
        return
    db = SessionLocal()
    try:
        subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
        _send_to_subscriptions(db, subs, title, body, url)
    finally:
        db.close()


def send_push_to_users(user_ids, title: str, body: str, url: str = "/"):
    if not _vapid or not user_ids:
        return
    db = SessionLocal()
    try:
        # 대상자 수만큼 쿼리를 반복하지 않고 한 번에 조회
        subs = db.query(PushSubscription).filter(PushSubscription.user_id.in_(list(user_ids))).all()
        _send_to_subscriptions(db, subs, title, body, url)
    finally:
        db.close()


def send_push_to_staff(title: str, body: str, url: str = "/"):
    db = SessionLocal()
    try:
        staff_ids = [u.id for u in db.query(User).filter(User.role.in_(("assistant", "admin"))).all()]
    finally:
        db.close()
    send_push_to_users(staff_ids, title, body, url)
