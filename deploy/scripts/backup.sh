#!/usr/bin/env bash
# 매일 새벽 3시 30분 systemd 타이머(sch-backup.timer)가 실행한다. 손으로 실행해도 된다.
#
# 1) DB를 pg_dump로 떠서 서버 안(backups/db)에 14일치 보관
# 2) 최신 DB 덤프 + 첨부파일 + AI 소스·모델 + 서버 비밀값 파일을 restic으로 암호화해 Cloudflare R2에 올린다
#    (미니PC가 통째로 고장 나도 새 PC에서 이것만으로 되살릴 수 있게. deploy/README.md "새 PC로 복구")
#    - restic은 바뀐 부분만 올린다. 보관 규칙: 하루 단위 14개, 주 단위 8개, 월 단위 24개
#    - 암호(RESTIC_PASSWORD)가 없으면 R2에 있는 백업은 아무도(우리도) 못 연다
# 3) 결과를 healthchecks.io에 알린다 → 실패하거나 아예 안 돌면 관리자에게 메일이 간다
set -Eeuo pipefail

ROOT=/srv/sch-cse-task
DEPLOY="$ROOT/app/deploy"
ENV_FILE="$DEPLOY/backup.env"
RESTIC_IMAGE=restic/restic:0.18.0

# shellcheck disable=SC1090
source "$ENV_FILE"

hc() {  # healthchecks.io 알림. 알림이 실패해도 백업 자체는 계속한다
  [ -n "${HC_BACKUP_URL:-}" ] || return 0
  curl -fsS -m 10 --retry 3 -o /dev/null --data-raw "${2:-}" "$HC_BACKUP_URL$1" || true
}
trap 'hc /fail "backup.sh ${LINENO}번째 줄에서 실패"' ERR

restic() {
  docker run --rm -i --env-file "$ENV_FILE" \
    -v "$ROOT/backups/latest:/data/db:ro" \
    -v "$ROOT/data/uploads:/data/uploads:ro" \
    -v "$ROOT/ai:/data/ai:ro" \
    -v "$DEPLOY/.env:/data/secrets/compose.env:ro" \
    -v "$DEPLOY/backend.env:/data/secrets/backend.env:ro" \
    -v sch-restic-cache:/root/.cache/restic \
    "$RESTIC_IMAGE" "$@"
}

hc /start

echo "== DB 덤프"
STAMP=$(date +%Y%m%d-%H%M)
mkdir -p "$ROOT/backups/db" "$ROOT/backups/latest"
DUMP="$ROOT/backups/db/sch-$STAMP.dump"
docker compose -f "$DEPLOY/docker-compose.yml" exec -T db \
  pg_dump -U app -d sch --format=custom > "$DUMP.part"
mv "$DUMP.part" "$DUMP"
# R2에는 항상 같은 이름으로 올린다 (restic 스냅샷끼리 경로가 같아야 보관 규칙이 맞게 동작)
cp "$DUMP" "$ROOT/backups/latest/sch.dump"
find "$ROOT/backups/db" -name 'sch-*.dump' -mtime +14 -delete
ls -lh "$DUMP"

echo "== R2로 암호화 백업"
restic backup /data/db /data/uploads /data/ai /data/secrets --host sch-cse-task --tag daily

echo "== 오래된 백업 정리"
# --group-by host: 백업 대상 폴더가 바뀌어도 한 묶음으로 보고 보관 규칙을 적용한다
FORGET_ARGS=(--host sch-cse-task --group-by host --keep-daily 14 --keep-weekly 8 --keep-monthly 24)
if [ "$(date +%u)" = 7 ]; then
  # 일요일에만 실제로 공간을 비우고(prune), 저장된 데이터 일부를 다시 읽어 깨진 곳이 없는지 본다
  restic forget "${FORGET_ARGS[@]}" --prune
  restic check --read-data-subset=10%
else
  restic forget "${FORGET_ARGS[@]}"
fi

SUMMARY=$(restic snapshots --host sch-cse-task --latest 1 --compact | tail -n 3)
echo "$SUMMARY"
hc "" "$(printf 'DB 덤프 %s\n%s' "$(du -h "$DUMP" | cut -f1)" "$SUMMARY")"
echo "== 완료"
