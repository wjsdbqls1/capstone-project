# backend/upload_utils.py
import os
import uuid

from fastapi import HTTPException, UploadFile

import storage_service

MAX_UPLOAD_SIZE = storage_service.MAX_UPLOAD_SIZE
_CHUNK_SIZE = 1024 * 1024

# 올릴 수 있는 확장자. 첨부는 공개 주소로 서빙되므로, .html/.svg 같이
# 브라우저가 실행해 버리는 형식이 섞이면 그 주소가 피싱 페이지로 쓰일 수 있다.
# 실제로 주고받는 형식만 남긴다.
ALLOWED_EXTS = {
    # 이미지
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".heic",
    # 문서
    ".pdf",
    ".hwp", ".hwpx",
    ".doc", ".docx",
    ".xls", ".xlsx",
    # 압축
    ".zip",
}

_ALLOWED_TEXT = "이미지, PDF, 한글, 워드, 엑셀, zip"


def save_upload(file: UploadFile, upload_dir: str) -> str:
    """업로드 파일을 UUID 기반 이름으로 저장하고 저장된 파일명을 반환.

    원본 파일명은 확장자만 취하고 버려서 경로 조작(../ 등)을 막고,
    크기 상한(MAX_UPLOAD_SIZE) 초과 시 413 에러와 함께 중단해 용량 소진을 방지한다.

    Supabase Storage가 설정돼 있으면 그쪽에 올린다. Render 디스크는 배포할 때마다
    비워져서 첨부파일이 사라지기 때문. 반환값은 예전과 같은 '파일명'이라
    호출하는 쪽과 DB에 저장된 기존 값의 형태는 달라지지 않는다.
    """
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"올릴 수 없는 형식입니다. {_ALLOWED_TEXT} 파일만 첨부할 수 있습니다.",
        )

    saved_name = f"{uuid.uuid4()}{file_ext}"

    if storage_service.enabled:
        data = storage_service.read_capped(file)
        object_path = f"{storage_service.folder_of(upload_dir)}/{saved_name}"
        storage_service.upload_bytes(object_path, data, file.content_type)
        return saved_name

    return _save_to_disk(file, upload_dir, saved_name)


def _save_to_disk(file: UploadFile, upload_dir: str, saved_name: str) -> str:
    os.makedirs(upload_dir, exist_ok=True)
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
                    raise HTTPException(status_code=413, detail=storage_service.SIZE_LIMIT_MESSAGE)
                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    return saved_name
