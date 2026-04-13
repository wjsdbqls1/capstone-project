"""
2단계 Re-ranking 모델.

동작 방식:
  1단계(분류): KoBERTClassifier가 문의를 카테고리로 분류
  2단계(리랭킹): 같은 카테고리의 FAQ 답변 후보들에 대해 질문-답변 쌍을
                KoBERT Cross-Encoder로 점수화하여 적합도 순위 결정

Cross-Encoder 구조:
  [CLS] 질문 [SEP] 답변 [SEP] → KoBERT → [CLS] 토큰 → Linear → 적합도 점수 (스칼라)
"""

import torch
import torch.nn as nn
from transformers import BertModel, BertTokenizer
from kobert_models.kobert_classifier import KOBERT_MODEL_NAME


class KoBERTCrossEncoder(nn.Module):
    """질문-답변 쌍의 적합도 점수를 출력하는 Cross-Encoder."""

    def __init__(self, dropout_prob: float = 0.1):
        super().__init__()
        self.bert = BertModel.from_pretrained(KOBERT_MODEL_NAME, attn_implementation="eager")
        hidden_size = self.bert.config.hidden_size
        self.dropout = nn.Dropout(dropout_prob)
        self.scorer = nn.Linear(hidden_size, 1)

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
        )
        pooled = outputs.pooler_output       # (batch, hidden)
        pooled = self.dropout(pooled)
        score = self.scorer(pooled).squeeze(-1)  # (batch,)
        return score


def load_reranker(checkpoint_path: str | None = None, device: str = "cpu") -> KoBERTCrossEncoder:
    model = KoBERTCrossEncoder()
    if checkpoint_path:
        state = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(state)
    model.to(device)
    return model


class RerankerDataset(torch.utils.data.Dataset):
    """
    리랭커 학습 데이터셋.

    각 샘플: {"question": str, "answer": str, "label": int (1=관련, 0=비관련)}
    학습 방식: Binary Cross-Entropy (관련 답변 vs 비관련 답변)
    """

    def __init__(
        self,
        data: list[dict],
        tokenizer: BertTokenizer,
        max_length: int = 256,
    ):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.data = data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        encoding = self.tokenizer(
            item["question"],
            item["answer"],
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "token_type_ids": encoding.get(
                "token_type_ids",
                torch.zeros(self.max_length, dtype=torch.long)
            ).squeeze(0),
            "label": torch.tensor(item["label"], dtype=torch.float),
        }
