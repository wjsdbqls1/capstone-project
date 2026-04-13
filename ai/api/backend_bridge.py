"""
기존 FastAPI 백엔드 DB에서 AI 모듈에 필요한 데이터를 조회하는 브릿지.

backend/database.py의 SessionLocal을 직접 사용하여 FAQ 및 문의 데이터 로드.
이 파일은 ai/api/router.py에서 import 되며, PYTHONPATH에 backend 경로가 포함되어야 함.
"""

import sys
from pathlib import Path

# backend 경로를 sys.path에 추가
BACKEND_DIR = Path(__file__).parent.parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def load_faq_db() -> list[dict]:
    """
    FAQ 테이블 전체 로드.
    카테고리 컬럼이 없으므로 question 텍스트 기반으로 임시 분류 (추후 category 컬럼 추가 권장).
    """
    from database import SessionLocal
    from models import FAQ

    db = SessionLocal()
    try:
        faqs = db.query(FAQ).all()
        return [
            {
                "id": faq.id,
                "question": faq.question,
                "answer_html": faq.answer_html,
                "category": _infer_category(faq.question),
            }
            for faq in faqs
        ]
    finally:
        db.close()


def load_inquiry_history() -> list[dict]:
    """
    문의 전체 로드 (예측/요약용).
    카테고리는 FAQ와 동일하게 임시 추론.
    """
    from database import SessionLocal
    from models import Inquiry

    db = SessionLocal()
    try:
        inquiries = db.query(Inquiry).all()
        return [
            {
                "id": inq.id,
                "title": inq.title,
                "content": inq.content,
                "created_at": inq.created_at.isoformat(),
                "category": _infer_category(inq.title + " " + inq.content),
            }
            for inq in inquiries
        ]
    finally:
        db.close()


# 카테고리 키워드 매핑 (모델 학습 전 임시 규칙 기반 분류)
_CATEGORY_KEYWORDS = {
    "수강신청": ["수강신청", "수강 신청", "강의 신청", "수강취소", "수강 정정"],
    "성적": ["성적", "GPA", "학점", "이의신청", "성적표"],
    "졸업": ["졸업", "졸업논문", "학위", "졸업예정"],
    "장학금": ["장학금", "장학", "국가장학", "성적장학"],
    "휴복학": ["휴학", "복학", "군휴학", "군입대"],
    "등록금": ["등록금", "납부", "분할납부", "등록 기간"],
    "기숙사": ["기숙사", "생활관", "입사", "퇴사"],
    "공결_출석": ["공결", "출석", "결석", "출석인정", "공결신청"],
    "증명서": ["증명서", "재학증명", "성적증명", "졸업증명", "발급"],
}


def _infer_category(text: str) -> str:
    """키워드 매칭으로 카테고리 추론. 모델 학습 전 임시 사용."""
    for category, keywords in _CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return category
    return "기타"
