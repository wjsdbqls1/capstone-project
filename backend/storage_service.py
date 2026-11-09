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

# 공결 증빙서류(진단서 등)는 민감 정보라 공개 버킷과 분리한 비공개 버킷에 둔다.
# 주소만 알면 누구나 받는 공개 URL 대신, 조교가 열 때마다 서버가 권한을 확인하고
# 잠깐만 유효한 서명 URL을 내준다(signed_url).
PRIVATE_BUCKET = os.getenv("SUPABASE_PRIVATE_BUCKET", "absence-private")
SIGNED_URL_TTL = 60  # 초. 새 창이 열리는 동안만 쓰이면 충분하다

# ★ Supabase 버킷(attachments, absence-private 둘 다)의 file_size_limit과 같은 값이어야 한다.
#   여기만 올리면 버킷에서 거부되고, 버킷만 올리면 여기서 먼저 잘린다.
#   (스캔 PDF 여러 장이 10MB를 넘는 일이 실제로 있어 30MB로 정함)
MAX_UPLOAD_MB = 30
MAX_UPLOAD_SIZE = MAX_UPLOAD_MB * 1024 * 1024
SIZE_LIMIT_MESSAGE = f"파일 크기는 {MAX_UPLOAD_MB}MB를 초과할 수 없습니다."

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


def signed_url(object_path: str, bucket: str = PRIVATE_BUCKET, expires_in: int = SIGNED_URL_TTL) -> str:
    """비공개 버킷의 파일을 expires_in초 동안만 열 수 있는 주소를 만든다."""
    res = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/sign/{bucket}/{quote(object_path)}",
        json={"expiresIn": expires_in},
        headers={"Authorization": f"Bearer {SUPABASE_SERVICE_KEY}", "apikey": SUPABASE_SERVICE_KEY},
        timeout=30,
    )
    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"파일을 불러오지 못했습니다. ({res.status_code})")
    # 응답은 "/object/sign/..."처럼 /storage/v1 아래의 상대 경로다
    return f"{SUPABASE_URL}/storage/v1{res.json()['signedURL']}"


def upload_bytes(object_path: str, data: bytes, content_type: str | None, bucket: str = BUCKET) -> None:
    res = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{bucket}/{quote(object_path)}",
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
    """상한을 넘으면 즉시 중단해 메모리/용량 소진을 막는다."""
    chunks = []
    size = 0
    while True:
        chunk = file.file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail=SIZE_LIMIT_MESSAGE)
        chunks.append(chunk)
    return b"".join(chunks)
