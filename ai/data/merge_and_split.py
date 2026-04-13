"""
raw/ 디렉토리의 검수 완료된 JSON 파일을 병합하고 train/val/test로 분리.

사용법:
    python merge_and_split.py --train_ratio 0.8 --val_ratio 0.1
"""

import json
import argparse
import random
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train_ratio", type=float, default=0.8)
    parser.add_argument("--val_ratio", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    raw_dir = Path(__file__).parent / "raw"
    processed_dir = Path(__file__).parent / "processed"
    processed_dir.mkdir(exist_ok=True)

    all_data = []
    for json_file in raw_dir.glob("*.json"):
        with open(json_file, encoding="utf-8") as f:
            data = json.load(f)
        all_data.extend(data)
        print(f"[로드] {json_file.name}: {len(data)}개")

    print(f"\n전체 데이터: {len(all_data)}개")

    random.seed(args.seed)
    random.shuffle(all_data)

    n = len(all_data)
    n_train = int(n * args.train_ratio)
    n_val = int(n * args.val_ratio)

    splits = {
        "train": all_data[:n_train],
        "val": all_data[n_train:n_train + n_val],
        "test": all_data[n_train + n_val:]
    }

    for split_name, split_data in splits.items():
        output_path = processed_dir / f"{split_name}.jsonl"
        with open(output_path, "w", encoding="utf-8") as f:
            for item in split_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        print(f"[저장] {output_path}: {len(split_data)}개")


if __name__ == "__main__":
    main()
