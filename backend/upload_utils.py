# backend/upload_utils.py
import os
import uuid

from fastapi import HTTPException, UploadFile

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
_CHUNK_SIZE = 1024 * 1024


def save_upload(file: UploadFile, upload_dir: str) -> str:
    """업로드 파일을 UUID 기반 이름으로 안전하게 저장하고 저장된 파일명을 반환.

    원본 파일명은 확장자만 취하고 버려서 경로 조작(../ 등)을 막고,
    10MB 초과 시 413 에러와 함께 중단해 디스크 소진을 방지한다.
    """
    os.makedirs(upload_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename or "")[1]
    saved_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, saved_name)

    size = 0
    try:
        with open(file_path, "wb") as buffer:
            while True:
                chunk = file.file.read(_CHUNK_SIZE)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_UPLOAD_SIZE:
                    raise HTTPException(status_code=413, detail="파일 크기는 10MB를 초과할 수 없습니다.")
                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    return saved_name
