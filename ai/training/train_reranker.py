"""
KoBERT Cross-Encoder 리랭커 학습 스크립트.

학습 데이터 형식 (reranker_train.jsonl):
    {"question": "수강신청 취소 기간이 언제인가요?", "answer": "수강신청 취소는 ...", "label": 1}
    {"question": "수강신청 취소 기간이 언제인가요?", "answer": "기숙사 입사는 ...", "label": 0}

사용법:
    python train_reranker.py \
        --train_path ../data/processed/reranker_train.jsonl \
        --val_path ../data/processed/reranker_val.jsonl \
        --output_dir ../saved_models/reranker
"""

import sys
import json
import argparse
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from transformers import get_linear_schedule_with_warmup

sys.path.insert(0, str(Path(__file__).parent.parent))
from kobert_models.reranker import KoBERTCrossEncoder, RerankerDataset
from kobert_models.kobert_classifier import load_tokenizer


def load_jsonl(path: str) -> list[dict]:
    data = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data


def evaluate(model, loader, device):
    model.eval()
    total_loss = 0.0
    criterion = nn.BCEWithLogitsLoss()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for batch in loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            token_type_ids = batch["token_type_ids"].to(device)
            labels = batch["label"].to(device)

            scores = model(input_ids, attention_mask, token_type_ids)
            loss = criterion(scores, labels)
            total_loss += loss.item()

            preds = (scores.sigmoid() > 0.5).long()
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(labels.long().cpu().tolist())

    avg_loss = total_loss / len(loader)
    accuracy = sum(p == l for p, l in zip(all_preds, all_labels)) / len(all_labels)
    return avg_loss, accuracy


def train(args):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[디바이스] {device}")

    tokenizer = load_tokenizer()
    train_data = load_jsonl(args.train_path)
    val_data = load_jsonl(args.val_path)

    train_dataset = RerankerDataset(train_data, tokenizer, max_length=args.max_length)
    val_dataset = RerankerDataset(val_data, tokenizer, max_length=args.max_length)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)

    model = KoBERTCrossEncoder(dropout_prob=0.1).to(device)

    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps,
    )
    criterion = nn.BCEWithLogitsLoss()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    best_val_acc = 0.0
    for epoch in range(1, args.epochs + 1):
        model.train()
        total_loss = 0.0
        for step, batch in enumerate(train_loader, 1):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            token_type_ids = batch["token_type_ids"].to(device)
            labels = batch["label"].to(device)

            optimizer.zero_grad()
            scores = model(input_ids, attention_mask, token_type_ids)
            loss = criterion(scores, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()
            if step % 50 == 0:
                print(f"  Epoch {epoch} Step {step}/{len(train_loader)} Loss: {loss.item():.4f}")

        val_loss, val_acc = evaluate(model, val_loader, device)
        avg_train_loss = total_loss / len(train_loader)
        print(f"[Epoch {epoch}] train_loss={avg_train_loss:.4f} | val_loss={val_loss:.4f} | val_acc={val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_path = output_dir / "best_reranker.pt"
            torch.save(model.state_dict(), best_path)
            print(f"  → 최고 모델 저장: {best_path}")

    print(f"\n학습 완료. 최고 val_acc: {best_val_acc:.4f}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train_path", default="../data/processed/reranker_train.jsonl")
    parser.add_argument("--val_path", default="../data/processed/reranker_val.jsonl")
    parser.add_argument("--output_dir", default="../saved_models/reranker")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--max_length", type=int, default=256)
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
