# backend/upload_utils.py
import os
import uuid

from fastapi import HTTPException, UploadFile

import storage_service

MAX_UPLOAD_SIZE = storage_service.MAX_UPLOAD_SIZE
_CHUNK_SIZE = 1024 * 1024


def save_upload(file: UploadFile, upload_dir: str) -> str:
    """업로드 파일을 UUID 기반 이름으로 저장하고 저장된 파일명을 반환.

    원본 파일명은 확장자만 취하고 버려서 경로 조작(../ 등)을 막고,
    10MB 초과 시 413 에러와 함께 중단해 용량 소진을 방지한다.

    Supabase Storage가 설정돼 있으면 그쪽에 올린다. Render 디스크는 배포할 때마다
    비워져서 첨부파일이 사라지기 때문. 반환값은 예전과 같은 '파일명'이라
    호출하는 쪽과 DB에 저장된 기존 값의 형태는 달라지지 않는다.
    """
    file_ext = os.path.splitext(file.filename or "")[1]
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
                    raise HTTPException(status_code=413, detail="파일 크기는 10MB를 초과할 수 없습니다.")
                buffer.write(chunk)
    except HTTPException:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    return saved_name
