#!/usr/bin/env bash
# Supabase(운영 DB + 첨부파일)를 학과 서버로 옮긴다. 리허설과 실제 전환에 같은 스크립트를 쓴다.
# 서버 DB의 public 스키마를 통째로 지우고 다시 채우므로, 서버 DB에만 있는 데이터는 사라진다.
#
# 사용법 (서버에서):
#   cd /srv/sch-cse-task/app/deploy
#   export SUPABASE_DB_URL='postgresql://postgres.<ref>:<비밀번호>@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
#   export SUPABASE_URL='https://<ref>.supabase.co'
#   export SUPABASE_SERVICE_KEY='<service_role 키>'
#   ./scripts/migrate_from_supabase.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL이 필요합니다}"
: "${SUPABASE_URL:?SUPABASE_URL이 필요합니다}"
: "${SUPABASE_SERVICE_KEY:?SUPABASE_SERVICE_KEY가 필요합니다}"
export SUPABASE_DB_URL SUPABASE_URL SUPABASE_SERVICE_KEY

ROOT=/srv/sch-cse-task
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$ROOT/backups/migrate"
mkdir -p "$OUT"
DUMP="$OUT/supabase-$STAMP.dump"
PG_IMAGE=postgres:18

echo "[1/7] 백엔드·AI 정지 (옮기는 중에 공지 수집 등이 끼어들지 않게)"
docker compose stop backend ai

echo "[2/7] Supabase DB 덤프 → $DUMP"
# 주소에 비밀번호가 들어 있어서 명령줄 인자 대신 환경변수로 넘긴다(ps에 안 보이게)
docker run --rm -e SUPABASE_DB_URL "$PG_IMAGE" \
  sh -c 'pg_dump "$SUPABASE_DB_URL" --schema=public --no-owner --no-privileges --format=custom' > "$DUMP"
ls -lh "$DUMP"

echo "[3/7] 서버 DB의 public 스키마를 비우고 복원"
docker compose exec -T db psql -U app -d sch -v ON_ERROR_STOP=1 -q <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public AUTHORIZATION app;
GRANT USAGE ON SCHEMA public TO ai_reader;
SQL
# Supabase 전용 요소(정책의 역할 이름 등)는 여기 없어서 일부 오류가 날 수 있다.
# 오류는 로그로 남기고, 실제로 데이터가 다 왔는지는 5단계의 행 수 비교로 판단한다.
set +e
docker compose exec -T db pg_restore -U app -d sch --no-owner --no-privileges < "$DUMP" 2> "$OUT/restore-$STAMP.log"
RESTORE_RC=$?
set -e
if [ "$RESTORE_RC" -ne 0 ]; then
  echo "  pg_restore 경고/오류 (전체: $OUT/restore-$STAMP.log):"
  grep -E "ERROR|error" "$OUT/restore-$STAMP.log" | head -20 | sed 's/^/    /'
fi

echo "[4/7] 복원 후 정리 (RLS 끄기, AI 읽기 권한)"
docker compose exec -T db psql -U app -d sch -v ON_ERROR_STOP=1 -q < sql/after-restore.sql

echo "[5/7] 표별 행 수 비교 (Supabase ↔ 서버)"
docker run --rm -i -e SUPABASE_DB_URL "$PG_IMAGE" \
  sh -c 'psql "$SUPABASE_DB_URL" -At -F" " -f -' < scripts/count_rows.sql > "$OUT/rows-supabase-$STAMP.txt"
docker compose exec -T db psql -U app -d sch -At -F" " < scripts/count_rows.sql > "$OUT/rows-server-$STAMP.txt"
if diff -u "$OUT/rows-supabase-$STAMP.txt" "$OUT/rows-server-$STAMP.txt"; then
  echo "  모든 표의 행 수가 같습니다 ($(wc -l < "$OUT/rows-server-$STAMP.txt")개 표)"
else
  echo "  ⚠️ 행 수가 다른 표가 있습니다 (위 diff). 리허설 중이면 그 사이 새로 들어온 데이터일 수 있습니다."
fi

echo "[6/7] 첨부파일 내려받기 → $ROOT/data/uploads"
docker compose run --rm --no-deps -T \
  -e SUPABASE_DB_URL -e SUPABASE_URL -e SUPABASE_SERVICE_KEY \
  -v "$PWD/scripts:/scripts:ro" \
  backend python /scripts/pull_supabase_files.py /app/uploads

echo "[7/7] DB 안에 Supabase 주소가 남아 있는지 확인"
LEFT=$(docker compose exec -T db pg_dump -U app -d sch --data-only | grep -c "supabase.co" || true)
if [ "$LEFT" -gt 0 ]; then
  echo "  ⚠️ supabase.co 주소가 $LEFT줄 남아 있습니다. 이 파일들은 Supabase를 지우면 깨집니다:"
  docker compose exec -T db pg_dump -U app -d sch --data-only | grep -o "https://[a-z0-9]*\.supabase\.co[^\"' )<]*" | sort | uniq -c | head -20
else
  echo "  남은 Supabase 주소 없음"
fi

docker compose up -d backend ai
echo "완료. 덤프와 로그: $OUT"
