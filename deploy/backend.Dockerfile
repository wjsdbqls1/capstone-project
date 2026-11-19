# 학과 서버용 백엔드 이미지. 빌드 컨텍스트는 backend/ (docker-compose.yml 참고)
# Render는 backend/Dockerfile을 그대로 쓰므로 그쪽은 건드리지 않는다.
# Python 3.13: 보안 업데이트가 2029-10까지 나온다 (3.11은 2027-10 종료)
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# root가 아닌 계정으로 실행. uid 1000은 서버의 task 계정과 같아서
# 첨부파일 폴더(/srv/sch-cse-task/data/uploads)를 양쪽에서 그대로 읽고 쓸 수 있다.
RUN useradd --uid 1000 --create-home app \
 && mkdir -p /app/uploads \
 && chown -R app:app /app/uploads
USER app

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
