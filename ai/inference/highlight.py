"""
기능 2: 문의 원문 하이라이팅

KoBERT의 Self-Attention 메커니즘을 이용해 각 토큰의 중요도를 계산.

방식:
  - KoBERTClassifier 마지막 레이어의 attention 행렬에서
    [CLS] 토큰이 각 위치에 주는 가중치를 중요도로 사용
  - 서브워드 토큰을 원본 단어 단위로 병합
  - 상위 N개 단어를 하이라이트 대상으로 반환

반환 예시:
    {
        "tokens": ["수강신청", "취소", "기간", "알려주세요"],
        "scores": [0.82, 0.71, 0.65, 0.12],
        "highlights": ["수강신청", "취소", "기간"]  # 상위 3개
    }
"""

import sys
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).parent.parent))
from kobert_models.kobert_classifier import load_tokenizer, load_model

TOP_K = 3  # 상위 K개 단어 하이라이팅


class InquiryHighlighter:

    def __init__(self, classifier_path: str, device: str = "cpu"):
        self.device = device
        self.tokenizer = load_tokenizer()
        self.model = load_model(classifier_path, device)
        self.model.eval()

    def _merge_subwords(
        self, tokens: list[str], scores: list[float]
    ) -> tuple[list[str], list[float]]:
        """
        서브워드(##로 시작하는 토큰)를 앞 토큰에 병합하고 점수는 평균.
        [CLS], [SEP], [PAD] 등 특수 토큰 제거.
        """
        merged_words, merged_scores = [], []
        current_word, current_scores = "", []

        for token, score in zip(tokens, scores):
            if token in ("[CLS]", "[SEP]", "[PAD]"):
                if current_word:
                    merged_words.append(current_word)
                    merged_scores.append(sum(current_scores) / len(current_scores))
                    current_word, current_scores = "", []
                continue

            if token.startswith("##"):
                current_word += token[2:]
                current_scores.append(score)
            else:
                if current_word:
                    merged_words.append(current_word)
                    merged_scores.append(sum(current_scores) / len(current_scores))
                current_word = token
                current_scores = [score]

        if current_word:
            merged_words.append(current_word)
            merged_scores.append(sum(current_scores) / len(current_scores))

        return merged_words, merged_scores

    @torch.no_grad()
    def highlight(self, question: str) -> dict:
        enc = self.tokenizer(
            question,
            max_length=128,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        ).to(self.device)

        # forward → attention weights 추출
        _ = self.model(
            enc["input_ids"],
            enc["attention_mask"],
            enc.get("token_type_ids"),
        )
        # (batch=1, seq, seq) → [CLS] 행만 추출 → (seq,)
        attn_matrix = self.model.get_attention_weights()  # (1, seq, seq)
        cls_attn = attn_matrix[0, 0, :].cpu().tolist()   # [CLS] → 각 위치

        # 실제 토큰 수 (패딩 제외)
        seq_len = enc["attention_mask"].sum().item()
        tokens = self.tokenizer.convert_ids_to_tokens(
            enc["input_ids"][0, :seq_len].tolist()
        )
        scores = cls_attn[:seq_len]

        words, word_scores = self._merge_subwords(tokens, scores)

        # 정규화
        max_s = max(word_scores) if word_scores else 1.0
        word_scores = [round(s / max_s, 4) for s in word_scores]

        # 상위 K개 하이라이트
        indexed = sorted(enumerate(word_scores), key=lambda x: x[1], reverse=True)
        highlight_indices = {i for i, _ in indexed[:TOP_K]}
        highlights = [words[i] for i in sorted(highlight_indices)]

        return {
            "tokens": words,
            "scores": word_scores,
            "highlights": highlights,
        }
