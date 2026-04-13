"""
AI 기능을 FastAPI 라우터로 노출.
기존 backend/main.py에 include_router로 등록하여 사용.
"""

import os
import sys
from datetime import date
from pathlib import Path
from functools import lru_cache

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# ai/ 루트를 sys.path에 추가 (backend에서 import 시에도 동작)
AI_ROOT = Path(__file__).parent.parent
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

# ai/api/ 경로도 추가 (backend_bridge import용)
AI_API_DIR = Path(__file__).parent
if str(AI_API_DIR) not in sys.path:
    sys.path.insert(0, str(AI_API_DIR))

from inference.predict import AnswerCandidatePredictor
from inference.highlight import InquiryHighlighter
from inference.forecast import forecast_next_week
from inference.summarize import summarize_period

router = APIRouter()

# 모델 경로: 환경변수 또는 프로젝트 루트 기준 절대 경로
_PROJECT_ROOT = Path(__file__).parent.parent.parent
CLASSIFIER_PATH = os.getenv(
    "CLASSIFIER_MODEL_PATH",
    str(_PROJECT_ROOT / "ai" / "saved_models" / "classifier" / "best_classifier.pt")
)
RERANKER_PATH = os.getenv(
    "RERANKER_MODEL_PATH",
    str(_PROJECT_ROOT / "ai" / "saved_models" / "reranker" / "best_reranker.pt")
)


# ──────────────────────────────
# 모델 싱글톤 (서버 시작 시 1회 로드)
# ──────────────────────────────

@lru_cache(maxsize=1)
def _get_predictor() -> AnswerCandidatePredictor:
    from backend_bridge import load_faq_db
    faq_db = load_faq_db()
    return AnswerCandidatePredictor(CLASSIFIER_PATH, RERANKER_PATH, faq_db)


@lru_cache(maxsize=1)
def _get_highlighter() -> InquiryHighlighter:
    return InquiryHighlighter(CLASSIFIER_PATH)


# ──────────────────────────────
# 스키마
# ──────────────────────────────

class PredictRequest(BaseModel):
    question: str


class HighlightRequest(BaseModel):
    question: str


class SummarizeRequest(BaseModel):
    start_date: date
    end_date: date


# ──────────────────────────────
# 엔드포인트
# ──────────────────────────────

@router.post("/predict")
async def predict_answer_candidates(req: PredictRequest):
    """
    문의 답변 후보 제공.
    1단계 카테고리 분류 → 2단계 FAQ 리랭킹 결과 반환.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question이 비어 있습니다.")
    try:
        predictor = _get_predictor()
        return predictor.predict(req.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/highlight")
async def highlight_inquiry(req: HighlightRequest):
    """
    문의 원문 하이라이팅.
    Self-Attention 기반 핵심 단어 추출.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question이 비어 있습니다.")
    try:
        highlighter = _get_highlighter()
        return highlighter.highlight(req.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast")
async def forecast_inquiry():
    """
    기간별 문의 예상 알림.
    과거 문의 패턴 기반으로 다음 주 증가 예상 카테고리 반환.
    """
    try:
        from backend_bridge import load_inquiry_history
        inquiries = load_inquiry_history()
        alerts = forecast_next_week(inquiries)
        return {"alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
async def summarize_inquiry_period(req: SummarizeRequest):
    """
    기간별 문의 요약.
    지정 기간의 문의를 카테고리별로 집계하고 대표 질문 추출.
    """
    if req.start_date > req.end_date:
        raise HTTPException(status_code=400, detail="start_date가 end_date보다 늦을 수 없습니다.")
    try:
        from backend_bridge import load_inquiry_history
        inquiries = load_inquiry_history()
        result = summarize_period(inquiries, req.start_date, req.end_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
