"""
리랭커 학습 데이터 생성.

전략:
  - 같은 카테고리의 질문-답변 쌍 → label=1 (관련)
  - 다른 카테고리의 질문-답변 쌍 → label=0 (비관련)
  - 비율: 1:2 (positive 1개당 negative 2개)

입력: raw/*.json (카테고리별 Q&A)
출력: processed/reranker_train.jsonl, processed/reranker_val.jsonl
"""

import json
import random
from pathlib import Path


def main(seed: int = 42, neg_ratio: int = 2):
    random.seed(seed)
    raw_dir = Path(__file__).parent / "raw"
    processed_dir = Path(__file__).parent / "processed"
    processed_dir.mkdir(exist_ok=True)

    # 카테고리별 데이터 로드
    by_category: dict[str, list[dict]] = {}
    for json_file in raw_dir.glob("*.json"):
        with open(json_file, encoding="utf-8") as f:
            data = json.load(f)
        cat = json_file.stem
        by_category[cat] = data

    categories = list(by_category.keys())
    all_pairs = []

    for cat, items in by_category.items():
        other_cats = [c for c in categories if c != cat]

        for item in items:
            q = item["question"]
            a = item["answer"]

            # Positive: 같은 카테고리 내 다른 답변 (또는 자기 자신)
            same_pool = [x["answer"] for x in items if x["answer"] != a]
            if not same_pool:
                same_pool = [a]
            pos_answer = random.choice(same_pool)
            all_pairs.append({"question": q, "answer": pos_answer, "label": 1})

            # Negative: 다른 카테고리에서 neg_ratio개
            for _ in range(neg_ratio):
                neg_cat = random.choice(other_cats)
                neg_item = random.choice(by_category[neg_cat])
                all_pairs.append({"question": q, "answer": neg_item["answer"], "label": 0})

    random.shuffle(all_pairs)
    n = len(all_pairs)
    n_train = int(n * 0.9)

    train_data = all_pairs[:n_train]
    val_data = all_pairs[n_train:]

    for split_name, data in [("reranker_train", train_data), ("reranker_val", val_data)]:
        out_path = processed_dir / f"{split_name}.jsonl"
        with open(out_path, "w", encoding="utf-8") as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        pos = sum(1 for x in data if x["label"] == 1)
        neg = sum(1 for x in data if x["label"] == 0)
        print(f"[저장] {out_path}: 총 {len(data)}개 (positive={pos}, negative={neg})")


if __name__ == "__main__":
    main()
