# backend/routers/memos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import date

from database import SessionLocal
from models import CalendarMemo, User
from deps import get_db, get_current_user

router = APIRouter(prefix="/memos", tags=["memos"])

class MemoCreate(BaseModel):
    memo_date: date
    content: str

class MemoResponse(BaseModel):
    id: int
    memo_date: date
    content: str

@router.get("", response_model=List[MemoResponse])
def get_my_memos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CalendarMemo).filter(CalendarMemo.user_id == current_user.id).all()

@router.post("")
def create_memo(memo: MemoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_memo = CalendarMemo(
        user_id=current_user.id,
        memo_date=memo.memo_date,
        content=memo.content
    )
    db.add(new_memo)
    db.commit()
    db.refresh(new_memo)
    return {"message": "메모 저장 완료"}

@router.delete("/{memo_id}")
def delete_memo(memo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memo = db.query(CalendarMemo).filter(CalendarMemo.id == memo_id, CalendarMemo.user_id == current_user.id).first()
    if not memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    
    db.delete(memo)
    db.commit()
    return {"message": "삭제 완료"}