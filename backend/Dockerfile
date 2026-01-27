FROM python:3.11-slim

WORKDIR /app

# 라이브러리 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 복사
COPY . .

# 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]