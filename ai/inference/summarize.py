"""
기능 4: 연말/연초 문의 요약

특정 기간에 접수된 문의들에서 중심 문장을 추출 (TextRank 알고리즘).
카테고리 비율과 함께 요약 결과 반환.

방식:
  - 기간 내 문의를 카테고리별 집계 → 비율 계산
  - 각 카테고리 내 대표 질문을 TextRank로 추출
  - 최종 결과를 비율 순서로 정렬하여 반환

반환 예시:
    {
        "period": "2025-12-01 ~ 2026-01-31",
        "total_count": 128,
        "summary": [
            {"rank": 1, "category": "성적", "count": 51, "ratio": 0.40, "representative": "성적 이의신청 기간이 언제인가요?"},
            {"rank": 2, "category": "기숙사", "count": 38, "ratio": 0.30, "representative": "기숙사 입사 신청은 어떻게 하나요?"},
        ],
        "message": "이번 기간 주요 문의: 1. 성적 이의 신청(40%), 2. 기숙사 입사 문의(30%)"
    }
"""

from __future__ import annotations

from collections import Counter
from datetime import date

import numpy as np


def _cosine_similarity(v1: list[float], v2: list[float]) -> float:
    a, b = np.array(v1), np.array(v2)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom > 0 else 0.0


def _text_rank(sentences: list[str], top_k: int = 1, damping: float = 0.85, iterations: int = 30) -> list[str]:
    """
    TextRank로 대표 문장 추출.
    벡터화는 글자 n-gram 기반 TF-IDF (외부 의존 없이 간단 구현).
    """
    if len(sentences) <= top_k:
        return sentences

    # 글자 bigram 집합으로 간단 유사도 계산
    def to_bigrams(s: str) -> set[str]:
        return {s[i:i+2] for i in range(len(s) - 1)}

    def jaccard(s1: str, s2: str) -> float:
        a, b = to_bigrams(s1), to_bigrams(s2)
        if not a and not b:
            return 0.0
        return len(a & b) / len(a | b)

    n = len(sentences)
    # 유사도 행렬
    sim_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                sim_matrix[i][j] = jaccard(sentences[i], sentences[j])

    # 행 정규화
    row_sums = sim_matrix.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    sim_matrix = sim_matrix / row_sums

    # PageRank 반복
    scores = np.ones(n) / n
    for _ in range(iterations):
        scores = (1 - damping) / n + damping * sim_matrix.T @ scores

    top_indices = scores.argsort()[::-1][:top_k]
    return [sentences[i] for i in sorted(top_indices, key=lambda x: scores[x], reverse=True)]


def summarize_period(
    inquiries: list[dict],
    start_date: date,
    end_date: date,
) -> dict:
    """
    기간 내 문의 요약 생성.

    inquiries 형식:
        [{"created_at": "2025-12-01T...", "content": "...", "category": "성적"}, ...]
    """
    from datetime import datetime

    # 기간 필터링
    filtered = []
    for inq in inquiries:
        created = datetime.fromisoformat(inq["created_at"]).date()
        if start_date <= created <= end_date:
            filtered.append(inq)

    if not filtered:
        return {
            "period": f"{start_date} ~ {end_date}",
            "total_count": 0,
            "summary": [],
            "message": "해당 기간에 접수된 문의가 없습니다.",
        }

    total = len(filtered)

    # 카테고리별 집계
    by_category: dict[str, list[str]] = {}
    for inq in filtered:
        cat = inq.get("category", "기타")
        by_category.setdefault(cat, [])
        # 질문 제목(title) 또는 내용(content) 사용
        text = inq.get("title") or inq.get("content", "")
        if text:
            by_category[cat].append(text)

    category_counts = Counter({cat: len(texts) for cat, texts in by_category.items()})

    summary = []
    for rank, (cat, count) in enumerate(category_counts.most_common(), start=1):
        texts = by_category[cat]
        representative = _text_rank(texts, top_k=1)[0] if texts else ""
        summary.append({
            "rank": rank,
            "category": cat,
            "count": count,
            "ratio": round(count / total, 2),
            "representative": representative,
        })

    # 요약 메시지 생성
    top3 = summary[:3]
    parts = [f"{item['rank']}. {item['category']}({int(item['ratio'] * 100)}%)" for item in top3]
    message = f"이번 기간 주요 문의: {', '.join(parts)}"

    return {
        "period": f"{start_date} ~ {end_date}",
        "total_count": total,
        "summary": summary,
        "message": message,
    }
