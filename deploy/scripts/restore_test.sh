#!/usr/bin/env bash
# 백업이 "진짜로 복원되는지" 확인한다. 매달 1일 새벽 systemd 타이머(sch-restore-test.timer)가 실행한다.
# 백업은 복원해 봐야 의미가 있다. 운영 DB·파일은 건드리지 않고, 임시 폴더와 임시 DB 컨테이너만 쓴다.
#
# 1) R2에서 가장 최근 백업을 임시 폴더로 내려받는다(암호 해제 포함)
# 2) 임시 PostgreSQL 컨테이너에 DB 덤프를 복원한다
# 3) 표별 행 수와 첨부파일 수를 운영과 비교해 출력한다
set -Eeuo pipefail

ROOT=/srv/sch-cse-task
DEPLOY="$ROOT/app/deploy"
ENV_FILE="$DEPLOY/backup.env"
RESTIC_IMAGE=restic/restic:0.18.0
WORK="$ROOT/backups/restore-test"
TMP_DB=sch-restore-test-db

# shellcheck disable=SC1090
source "$ENV_FILE"

hc() {
  [ -n "${HC_RESTORE_URL:-}" ] || return 0
  curl -fsS -m 10 --retry 3 -o /dev/null --data-raw "${2:-}" "$HC_RESTORE_URL$1" || true
}
cleanup() {
  docker rm -f "$TMP_DB" >/dev/null 2>&1 || true
  # 복원본에는 개인정보가 들어 있으므로 확인이 끝나면 지운다 (컨테이너가 root로 만든 파일이라 컨테이너로 지운다)
  docker run --rm -v "$ROOT/backups:/b" alpine:3 rm -rf /b/restore-test >/dev/null 2>&1 || true
}
trap 'hc /fail "restore_test.sh ${LINENO}번째 줄에서 실패"' ERR
trap cleanup EXIT

hc /start
cleanup
mkdir -p "$WORK"

echo "== R2에서 최신 백업 내려받기"
docker run --rm --env-file "$ENV_FILE" -v "$WORK:/restore" -v sch-restic-cache:/root/.cache/restic \
  "$RESTIC_IMAGE" restore latest --host sch-cse-task --target /restore

echo "== 임시 DB에 복원"
docker run -d --name "$TMP_DB" -e POSTGRES_PASSWORD=restore-test -e POSTGRES_USER=app -e POSTGRES_DB=sch \
  -v "$WORK/data/db:/dump:ro" postgres:18 >/dev/null
for _ in $(seq 1 30); do
  docker exec "$TMP_DB" pg_isready -U app -d sch >/dev/null 2>&1 && break
  sleep 2
done
sleep 3
# 운영 DB에는 AI용 계정(ai_reader)이 있는데 임시 DB에는 없어서 그 권한 줄만 오류가 난다 → 무시
docker exec "$TMP_DB" pg_restore -U app -d sch --no-owner --no-privileges /dump/sch.dump || true

echo "== 운영과 비교 (백업 이후 새로 생긴 만큼은 운영이 더 많을 수 있다)"
docker exec -i "$TMP_DB" psql -U app -d sch -At -F" " < "$DEPLOY/scripts/count_rows.sql" > "$WORK/rows-restored.txt"
docker compose -f "$DEPLOY/docker-compose.yml" exec -T db psql -U app -d sch -At -F" " \
  < "$DEPLOY/scripts/count_rows.sql" > "$WORK/rows-live.txt"
REPORT=$(join -a1 -a2 -e0 -o 0,1.2,2.2 <(sort "$WORK/rows-restored.txt") <(sort "$WORK/rows-live.txt") \
  | awk '{printf "%-28s 복원 %7s  운영 %7s\n", $1, $2, $3}')
echo "$REPORT"

USERS=$(awk '$1=="users"{print $2}' "$WORK/rows-restored.txt")
FILES_RESTORED=$(find "$WORK/data/uploads" -type f | wc -l)
FILES_LIVE=$(find "$ROOT/data/uploads" -type f | wc -l)
echo "첨부파일: 복원 $FILES_RESTORED개, 운영 $FILES_LIVE개"

MODEL=saved_models/classifier/best_classifier.pt
if cmp -s "$WORK/data/ai/$MODEL" "$ROOT/ai/$MODEL"; then MODEL_OK=같음; else MODEL_OK=다름; fi
SECRETS=$(ls "$WORK/data/secrets" 2>/dev/null | wc -l)
echo "AI 모델: 운영과 $MODEL_OK, 비밀값 파일: ${SECRETS}개"

if [ "${USERS:-0}" -lt 1 ] || [ "$FILES_RESTORED" -lt 1 ] || [ "$MODEL_OK" != 같음 ] || [ "$SECRETS" -lt 2 ]; then
  hc /fail "복원본 이상 (users=$USERS, files=$FILES_RESTORED, model=$MODEL_OK, secrets=$SECRETS)"
  exit 1
fi
hc "" "$(printf '%s\n첨부파일: 복원 %s / 운영 %s\nAI 모델 %s, 비밀값 파일 %s개' "$REPORT" "$FILES_RESTORED" "$FILES_LIVE" "$MODEL_OK" "$SECRETS")"
echo "== 복원 확인 완료"
