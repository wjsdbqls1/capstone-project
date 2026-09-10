# backend/storage_service.py
"""첨부파일을 Supabase Storage에 저장한다.

Render의 디스크는 배포할 때마다 초기화돼서 업로드된 파일이 전부 사라진다.
그래서 파일 본체는 외부 스토리지에 두고, DB에는 예전처럼 파일명만 남긴다.
"""
import os
import uuid
from urllib.parse import quote

import requests
from dotenv import load_dotenv
from fastapi import HTTPException, UploadFile

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET = os.getenv("SUPABASE_BUCKET", "attachments")

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# 키가 없으면(로컬 개발 등) 예전처럼 디스크에 저장하도록 물러선다.
enabled = bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)


def folder_of(upload_dir: str) -> str:
    """"uploads/notices" 같은 기존 경로를 스토리지 폴더명으로 변환."""
    norm = str(upload_dir).replace("\\", "/").rstrip("/")
    marker = "uploads/"
    idx = norm.rfind(marker)
    rest = norm[idx + len(marker):] if idx != -1 else ""
    return rest or "misc"


def public_url(object_path: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{quote(object_path)}"


def upload_bytes(object_path: str, data: bytes, content_type: str | None) -> None:
    res = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{quote(object_path)}",
        data=data,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": content_type or "application/octet-stream",
            "x-upsert": "true",
        },
        timeout=60,
    )
    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"첨부파일 저장에 실패했습니다. ({res.status_code})")


def read_capped(file: UploadFile) -> bytes:
    """10MB를 넘으면 즉시 중단해 메모리/용량 소진을 막는다."""
    chunks = []
    size = 0
    while True:
        chunk = file.file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="파일 크기는 10MB를 초과할 수 없습니다.")
        chunks.append(chunk)
    return b"".join(chunks)
