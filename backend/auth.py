import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from deps import get_db
from models import User

load_dotenv()

bearer = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALG = os.getenv("JWT_ALG", "HS256")


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = cred.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="invalid token")

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=401, detail="user not found")
    return u


def require_assistant(u=Depends(get_current_user)) -> User:
    if u.role not in ("assistant", "admin"):
        raise HTTPException(status_code=403, detail="assistant only")
    return u


def require_admin(u=Depends(get_current_user)) -> User:
    """개발자(admin) 전용. 조교(assistant)는 통과하지 못한다.

    비밀번호 초기화처럼 계정을 직접 건드리는 기능은 조교에게 열어두지 않는다.
    """
    if u.role != "admin":
        raise HTTPException(status_code=403, detail="admin only")
    return u
