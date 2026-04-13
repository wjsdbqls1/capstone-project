"""
기능 3: 기간별 문의 예상 알림

카테고리별 과거 문의 건수를 날짜 데이터와 결합하여 시계열 패턴 학습.
다가오는 기간에 증가할 문의 카테고리를 예측해 알림 메시지 생성.

방식:
  - 과거 문의 DB에서 (날짜, 카테고리) 집계
  - 요일/주차/월 등 주기적 패턴을 피처로 사용
  - statsmodels SARIMAX 또는 단순 이동 평균으로 다음 주 예측
  - 평균 대비 1.5배 이상 증가 예상 카테고리를 알림으로 반환

반환 예시:
    [
        {
            "category": "졸업",
            "expected_count": 42,
            "baseline_avg": 12,
            "increase_ratio": 3.5,
            "message": "다음 주는 졸업 관련 문의가 증가할 것으로 예상됩니다."
        }
    ]
"""

from __future__ import annotations

import json
from datetime import date, timedelta
from collections import defaultdict

import numpy as np
import pandas as pd

INCREASE_THRESHOLD = 1.5   # 평균 대비 이 배율 이상이면 알림
FORECAST_WINDOW_DAYS = 7   # 다음 N일 예측


def build_daily_counts(inquiries: list[dict]) -> pd.DataFrame:
    """
    문의 목록 → 날짜×카테고리별 건수 DataFrame.

    inquiries 형식:
        [{"created_at": "2025-11-01T10:00:00", "category": "수강신청"}, ...]
    """
    counts: dict[tuple[date, str], int] = defaultdict(int)
    for inq in inquiries:
        created = pd.to_datetime(inq["created_at"]).date()
        category = inq.get("category", "기타")
        counts[(created, category)] += 1

    records = [
        {"date": d, "category": cat, "count": cnt}
        for (d, cat), cnt in counts.items()
    ]
    df = pd.DataFrame(records)
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date").reset_index(drop=True)


def _moving_average_forecast(series: pd.Series, window: int = 4) -> float:
    """단순 이동 평균 기반 다음 값 예측."""
    if len(series) < window:
        return float(series.mean()) if len(series) > 0 else 0.0
    return float(series.iloc[-window:].mean())


def forecast_next_week(inquiries: list[dict]) -> list[dict]:
    """
    다음 주 문의 예상량 예측 및 알림 생성.

    Returns:
        알림이 필요한 카테고리 목록 (increase_ratio >= INCREASE_THRESHOLD)
    """
    df = build_daily_counts(inquiries)
    if df.empty:
        return []

    # 주차별 카테고리 집계
    df["week"] = df["date"].dt.to_period("W")
    weekly = df.groupby(["week", "category"])["count"].sum().reset_index()

    alerts = []
    for category in weekly["category"].unique():
        cat_series = weekly[weekly["category"] == category].set_index("week")["count"]
        cat_series = cat_series.sort_index()

        # 전체 주간 평균
        baseline_avg = float(cat_series.mean())
        if baseline_avg == 0:
            continue

        # 다음 주 예측
        expected = _moving_average_forecast(cat_series, window=4)
        increase_ratio = expected / baseline_avg

        if increase_ratio >= INCREASE_THRESHOLD:
            alerts.append({
                "category": category,
                "expected_count": round(expected, 1),
                "baseline_avg": round(baseline_avg, 1),
                "increase_ratio": round(increase_ratio, 2),
                "message": f"다음 주는 {category} 관련 문의가 증가할 것으로 예상됩니다.",
            })

    # 증가율 내림차순 정렬
    alerts.sort(key=lambda x: x["increase_ratio"], reverse=True)
    return alerts
