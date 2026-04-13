"""
기능 1: 문의 답변 후보 제공 (2단계 파이프라인)

1단계 - 분류: KoBERTClassifier로 문의 카테고리 예측
2단계 - 리랭킹: 해당 카테고리의 FAQ 답변 후보를 Cross-Encoder로 점수화 후 정렬

반환 예시:
    {
        "category": "수강신청",
        "candidates": [
            {"faq_id": 12, "question": "...", "answer": "...", "score": 0.92},
            {"faq_id": 7,  "question": "...", "answer": "...", "score": 0.74},
        ]
    }
"""

import sys
from pathlib import Path

import torch
import torch.nn.functional as F

sys.path.insert(0, str(Path(__file__).parent.parent))
from kobert_models.kobert_classifier import (
    KoBERTClassifier,
    load_tokenizer,
    load_model,
    CATEGORY_LABELS,
    NUM_CLASSES,
)
from kobert_models.reranker import KoBERTCrossEncoder, load_reranker

MAX_CANDIDATES = 5  # 상위 N개 반환


class AnswerCandidatePredictor:
    """2단계 답변 후보 예측 파이프라인."""

    def __init__(
        self,
        classifier_path: str,
        reranker_path: str,
        faq_db: list[dict],  # [{"id": int, "question": str, "answer_html": str, "category": str}]
        device: str = "cpu",
    ):
        self.device = device
        self.tokenizer = load_tokenizer()

        self.classifier = load_model(classifier_path, device)
        self.classifier.eval()

        self.reranker = load_reranker(reranker_path, device)
        self.reranker.eval()

        # 카테고리별 FAQ 인덱스 구성
        self.faq_by_category: dict[str, list[dict]] = {cat: [] for cat in CATEGORY_LABELS}
        for faq in faq_db:
            cat = faq.get("category", "기타")
            if cat in self.faq_by_category:
                self.faq_by_category[cat].append(faq)

    @torch.no_grad()
    def predict_category(self, question: str) -> tuple[str, float]:
        """1단계: 문의 카테고리 분류."""
        enc = self.tokenizer(
            question,
            max_length=128,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        ).to(self.device)

        logits = self.classifier(
            enc["input_ids"],
            enc["attention_mask"],
            enc.get("token_type_ids"),
        )
        probs = F.softmax(logits, dim=-1).squeeze(0)
        label_idx = probs.argmax().item()
        return CATEGORY_LABELS[label_idx], probs[label_idx].item()

    @torch.no_grad()
    def rerank(self, question: str, candidates: list[dict]) -> list[dict]:
        """2단계: 후보 답변을 Cross-Encoder로 점수화."""
        if not candidates:
            return []

        # 답변 HTML에서 텍스트만 추출 (간단 처리)
        import re
        def strip_html(html: str) -> str:
            return re.sub(r"<[^>]+>", "", html).strip()

        scored = []
        for faq in candidates:
            answer_text = strip_html(faq.get("answer_html", ""))
            enc = self.tokenizer(
                question,
                answer_text,
                max_length=256,
                padding="max_length",
                truncation=True,
                return_tensors="pt",
            ).to(self.device)

            score = self.reranker(
                enc["input_ids"],
                enc["attention_mask"],
                enc.get("token_type_ids"),
            ).sigmoid().item()

            scored.append({**faq, "score": round(score, 4)})

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:MAX_CANDIDATES]

    def predict(self, question: str) -> dict:
        """전체 파이프라인 실행."""
        category, cat_confidence = self.predict_category(question)
        candidates_pool = self.faq_by_category.get(category, [])
        ranked = self.rerank(question, candidates_pool)

        return {
            "category": category,
            "category_confidence": round(cat_confidence, 4),
            "candidates": ranked,
        }
