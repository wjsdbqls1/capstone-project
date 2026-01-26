import os
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import SessionLocal
from models import User

load_dotenv()

# auth.py와 동일한 비밀키 설정을 사용해야 합니다.
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALG = os.getenv("JWT_ALG", "HS256")

# 로그인 API 주소 (Swagger UI에서 자물쇠 버튼 눌렀을 때 로그인할 주소)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# 데이터베이스 세션 가져오기
def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

# ★ 로그인한 사용자 정보 가져오기
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="자격 증명을 검증할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 1. 토큰 해독
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: str = payload.get("sub") # auth.py에서 user_id를 sub에 담았습니다.
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # 2. DB에서 사용자 찾기 (ID로 조회)
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
        
    return user