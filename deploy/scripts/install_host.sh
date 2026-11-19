#!/usr/bin/env bash
# 서버(Ubuntu)에 한 번만 실행하는 설정. 관리자 권한이 필요하다:
#   sudo /srv/sch-cse-task/app/deploy/scripts/install_host.sh
# 다시 실행해도 안전하다(같은 결과).
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "sudo로 실행하세요"; exit 1; }

DEPLOY=/srv/sch-cse-task/app/deploy

echo "== 스크립트 실행 권한"
chmod +x "$DEPLOY"/scripts/*.sh "$DEPLOY"/db-init/*.sh

echo "== 백업·복원확인·생존신호 타이머 등록"
install -m 644 "$DEPLOY"/systemd/sch-*.service "$DEPLOY"/systemd/sch-*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now sch-backup.timer sch-restore-test.timer sch-heartbeat.timer

echo "== 부팅 시 Docker 자동 시작"
systemctl enable docker containerd

echo "== 자동 보안 업데이트: Ubuntu + Docker·Tailscale·cloudflared, 필요하면 새벽 4시 30분 재부팅"
# cloudflared는 1년 넘은 버전을 Cloudflare가 지원하지 않으므로 자동 업데이트가 특히 중요하다
cat > /etc/apt/apt.conf.d/52sch-cse-task <<'EOF'
Unattended-Upgrade::Origins-Pattern {
        "origin=Docker";
        "origin=Tailscale";
        "origin=cloudflared";
};
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
EOF
systemctl enable --now unattended-upgrades

echo "== 저널 로그 상한 (디스크 보호)"
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=500M\n' > /etc/systemd/journald.conf.d/sch-cse-task.conf
systemctl restart systemd-journald

echo "== 완료"
systemctl list-timers 'sch-*' --no-pager
