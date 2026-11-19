"""Supabase Storage의 첨부파일을 학과 서버 디스크(uploads/)로 내려받는다.

DB에는 '/uploads/<폴더>/<파일명>' 같은 상대 경로(또는 파일명)만 저장돼 있고, 백엔드의
/uploads 경로는 디스크에 파일이 있으면 그걸 먼저 준다(main.py serve_upload).
그래서 같은 폴더 구조로 내려받기만 하면 DB는 고칠 필요가 없다.

버킷 → 디스크 경로 (upload_utils.save_upload / storage_service.folder_of의 역):
  attachments/misc/<f>         → uploads/<f>          폴더 없이 저장되던 문의 첨부
  attachments/<폴더>/<f>       → uploads/<폴더>/<f>
  absence-private/absence/<f>  → uploads/absence/<f>  공결 증빙서류(서명 링크로만 열림)

여러 번 실행해도 된다. 이미 같은 크기로 받아 둔 파일은 건너뛴다.

실행(서버, migrate_from_supabase.sh가 호출):
  docker compose run --rm --no-deps -e SUPABASE_DB_URL -e SUPABASE_URL -e SUPABASE_SERVICE_KEY \
      -v "$PWD/scripts:/scripts:ro" backend python /scripts/pull_supabase_files.py /app/uploads
"""
import os
import sys
from collections import Counter
from urllib.parse import quote

import psycopg2
import requests

BUCKETS = ("attachments", "absence-private")


def disk_path(bucket: str, name: str) -> str:
    if bucket == "attachments" and name.startswith("misc/"):
        rel = name[len("misc/"):]
    else:
        rel = name
    parts = rel.replace("\\", "/").split("/")
    if not rel or rel.startswith("/") or ".." in parts:
        raise ValueError(f"이상한 경로: {bucket}/{name}")
    return rel


def main(dest: str) -> int:
    db_url = os.environ["SUPABASE_DB_URL"]
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {"Authorization": f"Bearer {key}", "apikey": key}

    with psycopg2.connect(db_url) as conn, conn.cursor() as cur:
        # 혹시 모르는 버킷이 있으면 알 수 있게 전체 현황부터 보여 준다
        cur.execute("SELECT bucket_id, count(*) FROM storage.objects GROUP BY 1 ORDER BY 1")
        print("Supabase 버킷별 파일 수:", dict(cur.fetchall()))
        cur.execute(
            """
            SELECT bucket_id, name, (metadata->>'size')::bigint
            FROM storage.objects
            WHERE bucket_id = ANY(%s) AND name NOT LIKE '%%.emptyFolderPlaceholder'
            ORDER BY bucket_id, name
            """,
            (list(BUCKETS),),
        )
        rows = cur.fetchall()

    stats = Counter()
    failed = []
    session = requests.Session()
    for bucket, name, size in rows:
        rel = disk_path(bucket, name)
        target = os.path.join(dest, rel)
        if size is not None and os.path.isfile(target) and os.path.getsize(target) == size:
            stats["이미 있음"] += 1
            continue

        os.makedirs(os.path.dirname(target), exist_ok=True)
        url = f"{base}/storage/v1/object/{bucket}/{quote(name)}"
        try:
            with session.get(url, headers=headers, stream=True, timeout=120) as res:
                res.raise_for_status()
                tmp = target + ".part"
                with open(tmp, "wb") as f:
                    for chunk in res.iter_content(1024 * 1024):
                        f.write(chunk)
            got = os.path.getsize(tmp)
            if size is not None and got != size:
                os.remove(tmp)
                raise RuntimeError(f"크기 불일치 {got} != {size}")
            os.replace(tmp, target)
            stats["내려받음"] += 1
        except Exception as e:
            failed.append(f"{bucket}/{name}: {e}")

    print(f"대상 {len(rows)}개 — " + ", ".join(f"{k} {v}" for k, v in stats.items()))
    if failed:
        print(f"실패 {len(failed)}개:")
        for line in failed:
            print("  ", line)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "/app/uploads"))
