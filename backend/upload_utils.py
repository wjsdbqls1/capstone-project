# backend/upload_utils.py
import json
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
    ".ppt", ".pptx",
    # 압축
    ".zip",
}

_ALLOWED_TEXT = "이미지, PDF, 한글, 워드, 엑셀, 파워포인트, zip"


def check_allowed(filename: str) -> str:
    """허용 확장자인지 확인하고 소문자 확장자를 돌려준다."""
    file_ext = os.path.splitext(filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"올릴 수 없는 형식입니다. {_ALLOWED_TEXT} 파일만 첨부할 수 있습니다.",
        )
    return file_ext


# 한 번에 올릴 수 있는 첨부 개수. 문의·답변·공지·FAQ 공통.
MAX_FILES = 5


def _url_for(upload_dir: str, saved_name: str) -> str:
    """저장 폴더 + 파일명 → 앱이 쓰는 접근 경로(/uploads/notices/xxx 등)."""
    folder = str(upload_dir).replace("\\", "/").strip("/")
    return f"/{folder}/{saved_name}"


def collect_files(*groups) -> list:
    """옛 방식(file 하나)과 새 방식(files 여러 개)으로 들어온 파일을 한 목록으로 합친다.
    파일을 안 고르면 브라우저가 이름이 빈 항목을 보내기도 해서 걸러낸다."""
    out = []
    for g in groups:
        if g is None:
            continue
        items = g if isinstance(g, (list, tuple)) else [g]
        out.extend(f for f in items if f is not None and getattr(f, "filename", ""))
    return out


def save_uploads(files, upload_dir: str) -> list[dict]:
    """여러 첨부를 저장하고 [{"url", "name"}] 목록을 돌려준다.

    한 파일이라도 형식이 안 맞으면 아무것도 저장하지 않고 거절한다.
    (하나씩 저장하다 중간에 거절하면 앞 파일이 고아로 남는다)
    """
    files = collect_files(files)
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"첨부파일은 한 번에 {MAX_FILES}개까지 올릴 수 있습니다.",
        )
    for f in files:
        check_allowed(f.filename)
    return [
        {"url": _url_for(upload_dir, save_upload(f, upload_dir)), "name": f.filename}
        for f in files
    ]


def attachments_json(items: list[dict]) -> str | None:
    """첨부 목록을 DB(Text 컬럼)에 넣을 문자열로. 비어 있으면 None."""
    return json.dumps(items, ensure_ascii=False) if items else None


def parse_attachments(text: str | None, legacy_url: str | None = None, legacy_name: str | None = None) -> list[dict]:
    """DB의 첨부 목록을 되살린다.

    다중 첨부 이전에 저장된 행은 목록이 없고 단일 컬럼만 있으므로,
    그 값을 한 개짜리 목록으로 바꿔 화면이 한 가지 형태만 다루게 한다.
    """
    if text:
        try:
            items = json.loads(text)
            if isinstance(items, list):
                return [i for i in items if isinstance(i, dict) and i.get("url")]
        except ValueError:
            pass
    if legacy_url:
        return [{"url": legacy_url, "name": legacy_name or legacy_url.rsplit("/", 1)[-1]}]
    return []


def save_upload(file: UploadFile, upload_dir: str) -> str:
    """업로드 파일을 UUID 기반 이름으로 저장하고 저장된 파일명을 반환.

    원본 파일명은 확장자만 취하고 버려서 경로 조작(../ 등)을 막고,
    크기 상한(MAX_UPLOAD_SIZE) 초과 시 413 에러와 함께 중단해 용량 소진을 방지한다.

    Supabase Storage가 설정돼 있으면 그쪽에 올린다. Render 디스크는 배포할 때마다
    비워져서 첨부파일이 사라지기 때문. 반환값은 예전과 같은 '파일명'이라
    호출하는 쪽과 DB에 저장된 기존 값의 형태는 달라지지 않는다.
    """
    file_ext = check_allowed(file.filename)

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
