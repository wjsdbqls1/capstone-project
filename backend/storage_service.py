# backend/storage_service.py
"""첨부파일을 Supabase Storage에 저장한다.

Render의 디스크는 배포할 때마다 초기화돼서 업로드된 파일이 전부 사라진다.
그래서 파일 본체는 외부 스토리지에 두고, DB에는 예전처럼 파일명만 남긴다.

SUPABASE_URL을 비워 두면 서버 디스크(uploads/)에 저장한다(학과 서버, 로컬 개발).
이때도 공결 증빙서류는 공개 경로로 내주지 않고, 아래 local_signed_path()로 만든
짧은 유효기간의 서명 링크로만 연다.
"""
import hashlib
import hmac
import os
import time
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


# ───────────── 디스크 저장 모드의 비공개 파일(공결 증빙서류) ─────────────
# Supabase의 서명 URL과 같은 역할을 서버가 직접 한다.
# 조교 권한을 확인한 API가 "경로 + 만료시각"에 서명한 링크를 주고,
# /private-files/ 경로는 서명과 만료시각이 맞을 때만 파일을 내준다.

PRIVATE_FOLDERS = ("absence/",)
PRIVATE_FILE_ROUTE = "/private-files"


def _norm(path: str) -> str:
    return str(path).replace("\\", "/").lstrip("./").lower()


def is_private(path: str) -> bool:
    """공개 경로(/uploads)로 내주면 안 되는 파일인지. 대소문자·구분자 차이로 우회되지 않게 정규화해서 본다."""
    return _norm(path).startswith(PRIVATE_FOLDERS)


def _signing_key() -> bytes:
    secret = os.getenv("JWT_SECRET", "")
    if not secret:
        raise HTTPException(status_code=500, detail="서버 설정 오류: JWT_SECRET이 없습니다.")
    # 로그인 토큰 서명과 같은 키를 그대로 쓰지 않도록 용도별로 파생한다
    return hashlib.sha256(b"private-file-link:" + secret.encode()).digest()


def _signature(object_path: str, exp: int) -> str:
    msg = f"{object_path}\n{exp}".encode()
    return hmac.new(_signing_key(), msg, hashlib.sha256).hexdigest()


def local_signed_path(object_path: str, expires_in: int = SIGNED_URL_TTL) -> str:
    """디스크의 비공개 파일을 expires_in초 동안만 열 수 있는 상대 경로를 만든다."""
    exp = int(time.time()) + expires_in
    return f"{PRIVATE_FILE_ROUTE}/{quote(object_path)}?exp={exp}&sig={_signature(object_path, exp)}"


def verify_local_signature(object_path: str, exp: int, sig: str) -> bool:
    if exp < int(time.time()):
        return False
    return hmac.compare_digest(_signature(object_path, exp), sig or "")


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
