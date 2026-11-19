# 학과 서버용 AI 이미지. 소스는 compose의 additional_contexts(ai_src = /srv/sch-cse-task/ai)에서 가져온다.
# Hugging Face Space는 capstone-ai 저장소의 Dockerfile을 그대로 쓰므로 그쪽은 건드리지 않는다.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/opt/hf

WORKDIR /app
RUN useradd --uid 1000 --create-home app

# 미니PC에는 GPU가 없으므로 CPU 전용 torch를 먼저 깐다.
# (그냥 설치하면 수 GB짜리 CUDA 포함판이 깔린다)
COPY ai-requirements.lock.txt /tmp/lock.txt
RUN pip install --index-url https://download.pytorch.org/whl/cpu \
        "torch==$(grep -E '^torch==' /tmp/lock.txt | cut -d= -f3)"
# 나머지는 버전을 고정한 목록으로 설치한다. 버전을 안 고정하면 다시 빌드할 때
# 그날의 최신판이 깔려 예고 없이 깨질 수 있다(2026-10 HF Space psycopg 장애).
RUN grep -vE '^torch==' /tmp/lock.txt > /tmp/lock-notorch.txt \
 && pip install -r /tmp/lock-notorch.txt

# 분류 모델의 바탕(klue/bert-base)을 이미지에 미리 받아 둔다.
# 실행 중에 Hugging Face 서버가 느리거나 막혀도 AI가 뜨도록.
RUN python -c "from transformers import AutoTokenizer, BertModel; \
AutoTokenizer.from_pretrained('klue/bert-base'); \
BertModel.from_pretrained('klue/bert-base', attn_implementation='eager')" \
 && chown -R app:app /opt/hf
ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1

COPY --from=ai_src --chown=app:app app.py router.py backend_bridge.py ./
COPY --from=ai_src --chown=app:app inference ./inference
COPY --from=ai_src --chown=app:app models ./models
COPY --from=ai_src --chown=app:app saved_models ./saved_models

USER app
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
