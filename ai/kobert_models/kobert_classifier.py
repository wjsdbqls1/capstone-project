"""
KLUE BERT 기반 문의 카테고리 분류 모델.

구조:
  - klue/bert-base → [CLS] 토큰 → Dropout → Linear → 카테고리 확률
  - 카테고리: 수강신청(0), 성적(1), 졸업(2), 장학금(3), 휴복학(4),
             등록금(5), 기숙사(6), 공결_출석(7), 증명서(8), 기타(9)

모델 변경 이유:
  monologg/kobert는 최신 transformers(>=5.x)와 sdpa attention 호환 문제로
  output_attentions가 동작하지 않음. klue/bert-base는 완전 호환.
"""

import torch
import torch.nn as nn
from transformers import BertModel, BertTokenizer, AutoTokenizer

# 카테고리 매핑 (generate_qa.py의 CATEGORIES와 동일하게 유지)
CATEGORY_LABELS = [
    "수강신청", "성적", "졸업", "장학금", "휴복학",
    "등록금", "기숙사", "공결_출석", "증명서", "기타"
]
NUM_CLASSES = len(CATEGORY_LABELS)
KOBERT_MODEL_NAME = "klue/bert-base"


class KoBERTClassifier(nn.Module):
    """KLUE BERT 파인튜닝 분류 모델."""

    def __init__(self, num_classes: int = NUM_CLASSES, dropout_prob: float = 0.3):
        super().__init__()
        # eager attention: output_attentions 지원을 위해 명시
        self.bert = BertModel.from_pretrained(
            KOBERT_MODEL_NAME,
            attn_implementation="eager",
        )
        hidden_size = self.bert.config.hidden_size
        self.dropout = nn.Dropout(dropout_prob)
        self.classifier = nn.Linear(hidden_size, num_classes)

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
        token_type_ids: torch.Tensor | None = None,
    ) -> torch.Tensor:
        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
            output_attentions=True,  # 하이라이팅을 위해 attention 반환
        )
        # [CLS] 토큰의 pooled output 사용
        pooled = outputs.pooler_output          # (batch, hidden)
        pooled = self.dropout(pooled)
        logits = self.classifier(pooled)        # (batch, num_classes)

        # attentions: tuple of (batch, heads, seq, seq) — 마지막 레이어만 반환
        self._last_attentions = outputs.attentions  # inference 시 하이라이팅에 사용
        return logits

    def get_attention_weights(self) -> torch.Tensor:
        """마지막 forward에서의 마지막 레이어 attention 반환. highlight.py에서 사용."""
        if not hasattr(self, "_last_attentions"):
            raise RuntimeError("forward()를 먼저 호출하세요.")
        # 마지막 레이어, 모든 헤드 평균 → (batch, seq, seq)
        last_layer_attn = self._last_attentions[-1]   # (batch, heads, seq, seq)
        return last_layer_attn.mean(dim=1)            # (batch, seq, seq)


def load_tokenizer() -> AutoTokenizer:
    return AutoTokenizer.from_pretrained(KOBERT_MODEL_NAME)


def load_model(checkpoint_path: str | None = None, device: str = "cpu") -> KoBERTClassifier:
    """
    모델 로드. checkpoint_path가 있으면 파인튜닝된 가중치 로드.
    """
    model = KoBERTClassifier()
    if checkpoint_path:
        state = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(state)
    model.to(device)
    return model


class InquiryDataset(torch.utils.data.Dataset):
    """학습/검증 데이터셋."""

    def __init__(self, data: list[dict], tokenizer: BertTokenizer, max_length: int = 128):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.texts = [item["question"] for item in data]
        self.labels = [item["label"] for item in data]

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "token_type_ids": encoding.get("token_type_ids", torch.zeros(self.max_length, dtype=torch.long)).squeeze(0),
            "label": torch.tensor(self.labels[idx], dtype=torch.long),
        }
