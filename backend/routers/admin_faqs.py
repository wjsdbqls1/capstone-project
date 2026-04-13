from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_assistant
from deps import get_db
from models import FAQ

r = APIRouter(prefix="/admin/faqs", tags=["admin-faqs"])

VALID_CATEGORIES = ['수강신청', '성적', '졸업', '장학금', '휴복학', '등록금', '기숙사', '공결_출석', '증명서', '기타']

class FAQCreateIn(BaseModel):
    question: str
    answer_html: str
    category: str = "기타"

@r.post("")
def create_faq(data: FAQCreateIn, a=Depends(require_assistant), db: Session = Depends(get_db)):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 카테고리입니다. 허용값: {VALID_CATEGORIES}")
    f = FAQ(
        question=data.question,
        answer_html=data.answer_html,
        posted_date=date.today(),
        author_id=a.id,
        category=data.category,
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return {"id": f.id, "posted_date": str(f.posted_date)}

class FAQUpdateIn(BaseModel):
    question: str | None = None
    answer_html: str | None = None
    category: str | None = None

@r.patch("/{faq_id}")
def update_faq(faq_id: int, data: FAQUpdateIn, a=Depends(require_assistant), db: Session = Depends(get_db)):
    f = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="faq not found")

    if data.question is not None:
        f.question = data.question
    if data.answer_html is not None:
        f.answer_html = data.answer_html
    if data.category is not None:
        if data.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"유효하지 않은 카테고리입니다. 허용값: {VALID_CATEGORIES}")
        f.category = data.category

    db.commit()
    return {"id": f.id}

@r.delete("/{faq_id}")
def delete_faq(faq_id: int, a=Depends(require_assistant), db: Session = Depends(get_db)):
    f = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="faq not found")
    db.delete(f)
    db.commit()
    return {"ok": True}
