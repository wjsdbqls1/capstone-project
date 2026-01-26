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
