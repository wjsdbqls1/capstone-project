#!/usr/bin/env bash
# 5분마다 systemd 타이머(sch-heartbeat.timer)가 실행한다.
# 바깥 주소(Cloudflare → 터널 → 서버)로 세 서비스를 직접 불러 보고, 다 정상이면 healthchecks.io에
# "살아 있음"을 알린다. 서버가 꺼지거나 인터넷이 끊기면 알림 자체가 끊기므로, healthchecks.io가
# 일정 시간 소식이 없으면 관리자에게 메일을 보낸다.
set -uo pipefail

ENV_FILE=/srv/sch-cse-task/app/deploy/backup.env
# shellcheck disable=SC1090
source "$ENV_FILE"
[ -n "${HC_HEARTBEAT_URL:-}" ] || exit 0

problems=()
check() {  # 이름, 주소
  curl -fsS -m 15 -o /dev/null "$2" 2>/dev/null || problems+=("$1 응답 없음 ($2)")
}
check "백엔드(DB 포함)" https://api.sch-cse-task.com/healthz
check "프론트"         https://sch-cse-task.com/
check "AI"            https://ai.sch-cse-task.com/

# 디스크가 차면 DB가 멈춘다. 85%를 넘으면 미리 알린다
USED=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "$USED" -lt 85 ] || problems+=("디스크 사용량 ${USED}%")

if [ ${#problems[@]} -eq 0 ]; then
  curl -fsS -m 10 --retry 3 -o /dev/null "$HC_HEARTBEAT_URL" || true
else
  printf '%s\n' "${problems[@]}"
  curl -fsS -m 10 --retry 3 -o /dev/null --data-raw "$(printf '%s\n' "${problems[@]}")" "$HC_HEARTBEAT_URL/fail" || true
fi
