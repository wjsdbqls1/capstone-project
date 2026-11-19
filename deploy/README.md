# 학과 서버 운영 매뉴얼

순천향대 컴퓨터소프트웨어공학과 행정조교 시스템(`sch-cse-task.com`)을 학과 미니PC 한 대에서 운영하기 위한 문서다.
이 문서만 보고 서버를 점검·업데이트·복구할 수 있도록 쓴다. 비밀번호나 키 **값**은 여기에 적지 않는다(위치만 적는다).

---

## 1. 한눈에 보기

```
학생·조교 브라우저
   │ HTTPS
   ▼
Cloudflare (도메인·HTTPS·DDoS 방어)        ← 공유기/방화벽 포트 개방 없음
   │ Cloudflare Tunnel (서버가 바깥으로 연결을 맺는 방식)
   ▼
미니PC (Beelink Mini S12, Ubuntu Server 26.04 LTS, 학교망 고정 IP)
   ├─ cloudflared (터널, 호스트 서비스)
   └─ Docker Compose  /srv/sch-cse-task/app/deploy/docker-compose.yml
        ├─ web      127.0.0.1:8080  프론트(React 빌드 결과를 Caddy가 제공)  → sch-cse-task.com
        ├─ backend  127.0.0.1:8000  FastAPI                                 → api.sch-cse-task.com
        ├─ ai       127.0.0.1:7860  답변 추천·하이라이트·리포트 (CPU)        → ai.sch-cse-task.com
        └─ db       (내부 전용)     PostgreSQL 18
```

| 서버 경로 | 내용 |
|---|---|
| `/srv/sch-cse-task/app` | 이 저장소(GitHub `wjsdbqls1/capstone-project`) |
| `/srv/sch-cse-task/ai` | AI 서버 소스와 모델(약 420MB). 원본은 Hugging Face Space `wjsdbqls/capstone-ai` |
| `/srv/sch-cse-task/data/postgres` | DB 파일 |
| `/srv/sch-cse-task/data/uploads` | 첨부파일. `absence/`는 공결 증빙서류(진단서) |
| `/srv/sch-cse-task/backups` | 서버 안 DB 덤프(14일), 이전·빌드 로그 |
| `/srv/sch-cse-task/app/deploy/.env` 외 2개 | 비밀값 파일(아래 3절) |

## 2. 접속

- **원격 접속은 Tailscale + SSH 키**로만 된다. 비밀번호 SSH 로그인은 꺼 두었다.
  - 관리 PC에 Tailscale을 설치하고 서비스 전용 Google 계정(주소는 관리자 보관)으로 로그인한 뒤 `ssh task@100.72.168.21`.
  - 새 관리자 PC를 추가하려면, 기존 관리자가 새 PC의 공개키(`~/.ssh/id_ed25519.pub`)를 서버의 `~/.ssh/authorized_keys`에 한 줄 추가한다.
- **키를 모두 잃어버렸을 때**: 미니PC에 모니터·키보드를 직접 꽂고 `task` 계정 비밀번호로 로그인한다.
- 같은 학교망 안이면 학교망 고정 IP로도 된다(서버에서 `ip -4 addr`로 확인, 설정은 `/etc/netplan/`).

## 3. 계정과 비밀값 — 어디에 있나

| 무엇 | 어디 | 비고 |
|---|---|---|
| 서버 로그인 `task` 비밀번호 | 관리자가 따로 보관 | sudo에 필요 |
| 서비스 전용 Google 계정 | 관리자가 따로 보관 | Tailscale, healthchecks.io, Cloudflare 멤버 |
| Cloudflare 계정 | 도메인 구입자 계정 + 전용 계정(Super Administrator) | 도메인·터널·R2 |
| DB 비밀번호 | 서버 `deploy/.env` | 서버만 알면 된다 |
| 로그인 토큰 키(JWT_SECRET), 웹푸시 키(VAPID) | 서버 `deploy/backend.env` | 바꾸면 전원 재로그인 / 알림 재구독 |
| R2 접근 키 | 서버 `deploy/backup.env` | Cloudflare → R2 → Manage API tokens에서 재발급 가능 |
| **백업 암호(RESTIC_PASSWORD)** | 서버 `deploy/backup.env` + **서버 밖 두 곳** | **잃어버리면 R2 백업을 아무도 못 연다. 재발급 불가** |
| 터널 토큰 | Cloudflare → Zero Trust → Networks → Tunnels → `minipc` | 대시보드에서 다시 볼 수 있다 |

비밀값 파일 3개의 형식은 같은 폴더의 `*.example` 파일에 있다.

## 4. 자동으로 돌아가는 것

| 언제 | 무엇 | 실패하면 |
|---|---|---|
| 항상 | 컨테이너 4개. 죽거나 재부팅되면 자동으로 다시 뜬다(`restart: unless-stopped`) | — |
| 3시간마다 | 학과 홈페이지 공지 수집(백엔드 안) | 조교 화면의 수집 상태에 오류 표시 |
| 5분마다 | `sch-heartbeat.timer`: 바깥 주소로 세 서비스 + 디스크(85%) 확인 → healthchecks.io | 메일 |
| 매일 03:30 | `sch-backup.timer`: DB 덤프(서버 14일 보관) + R2 암호화 백업. 일요일엔 정리·검사 | 메일 |
| 매달 1일 05:00 | `sch-restore-test.timer`: R2에서 받아 임시 DB에 복원 → 운영과 행 수·파일 비교 | 메일 |
| 매일 | 보안 업데이트(Ubuntu, Docker, Tailscale, cloudflared). 필요하면 04:30 재부팅 | — |

알림은 healthchecks.io(전용 계정으로 로그인)에서 관리한다. 체크 3개: `서버 생존`, `매일 백업`, `월간 복원 확인`.
R2 백업 보관 규칙: 하루 단위 14개, 주 단위 8개, 월 단위 24개.

## 5. 자주 하는 일

모든 명령은 `cd /srv/sch-cse-task/app/deploy` 에서 실행한다.

```bash
docker compose ps                          # 상태 (4개 모두 Up, backend·db는 healthy)
docker compose logs -f --tail=100 backend  # 로그 보기 (Ctrl+C로 빠져나옴). backend 대신 ai, web, db
docker compose restart backend             # 하나만 다시 시작
systemctl list-timers 'sch-*'              # 자동 작업 다음 실행 시각
journalctl -u sch-backup.service -n 50     # 마지막 백업 로그
df -h /                                    # 디스크 사용량
```

### 코드 업데이트 배포 (GitHub에 올린 뒤)
```bash
cd /srv/sch-cse-task/app && git pull
cd deploy && docker compose up -d --build   # 바뀐 서비스만 다시 빌드·재시작
docker compose ps
```
- 백엔드는 시작할 때 DB 표를 자동으로 만들지만, **기존 표의 열 추가 같은 변경은 하지 않는다.** 모델(`backend/models.py`)을 바꿨다면 alembic 마이그레이션을 따로 실행해야 한다:
  `docker compose exec backend alembic upgrade head`
- 프론트의 API·AI 주소는 `docker-compose.yml`의 `web.build.args`에서 정한다.

### AI 업데이트
AI 소스를 `/srv/sch-cse-task/ai`에 덮어쓴 뒤 `docker compose up -d --build ai`.
파이썬 패키지 버전은 `deploy/ai-requirements.lock.txt`에 고정돼 있다(버전을 안 고정하면 재빌드 때 예고 없이 깨진다).

### 기반 이미지 업데이트 (분기마다 권장)
```bash
docker compose pull db                      # PostgreSQL 18.x 최신 패치
docker compose build --pull                 # python·node·caddy 기반 이미지 최신 패치로 다시 빌드
docker compose up -d
docker image prune -f                       # 안 쓰는 옛 이미지 정리
```
PostgreSQL **메이저 버전**(18 → 19)은 이 방법으로 올라가지 않는다. 덤프 → 새 버전 → 복원 절차가 필요하다(7절의 복원 절차와 같다).

### 서버 재부팅
`sudo reboot` — 컨테이너와 터널은 자동으로 다시 뜬다. 1~2분 뒤 `docker compose ps`로 확인.

## 6. 알림 메일을 받았을 때

1. `ssh task@100.72.168.21` 접속이 되는가?
   - **안 된다** → 미니PC 전원·랜선 확인. 정전 후에는 자동으로 켜진다(BIOS: State After G3 = S0). 그래도 안 되면 모니터를 꽂아 화면 확인.
2. `docker compose ps` — 멈춘 컨테이너가 있으면 `docker compose logs --tail=200 <이름>`으로 원인 확인 후 `docker compose up -d`.
3. 컨테이너는 다 정상인데 바깥에서 안 열린다 → 터널: `systemctl status cloudflared`, `sudo systemctl restart cloudflared`. Cloudflare 대시보드의 터널 상태가 Healthy인지 확인.
4. 백업 실패 메일 → `journalctl -u sch-backup.service -n 100`. R2 키가 만료·삭제됐거나 R2 장애인 경우가 많다. 고친 뒤 `sudo systemctl start sch-backup.service`로 다시 실행.
5. 디스크 85% 메일 → `du -sh /srv/sch-cse-task/* /var/lib/docker`로 큰 곳 확인. 보통 `docker image prune -a`로 옛 이미지를 지우면 된다.

## 7. 새 PC로 복구 (미니PC 고장·교체)

R2 백업에는 DB, 첨부파일, AI 소스·모델, 비밀값 파일(`deploy/.env`, `backend.env`)이 다 들어 있다.
필요한 것: **백업 암호**, Cloudflare 계정(R2 키 재발급·터널 토큰).

1. 새 PC에 Ubuntu Server LTS 설치 → `sudo apt update && sudo apt full-upgrade -y`
2. Docker 설치: `curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER` (다시 로그인)
3. 폴더와 코드:
   ```bash
   sudo mkdir -p /srv/sch-cse-task && sudo chown $USER: /srv/sch-cse-task
   cd /srv/sch-cse-task && git clone https://github.com/wjsdbqls1/capstone-project.git app
   mkdir -p data/uploads backups
   ```
4. `deploy/backup.env.example`을 보고 `deploy/backup.env`를 만든다(R2 키, 백업 암호).
5. R2에서 최신 백업 내려받기:
   ```bash
   cd /srv/sch-cse-task/app/deploy
   docker run --rm --env-file backup.env -v /srv/sch-cse-task/restore:/restore restic/restic:0.18.0 \
     restore latest --host sch-cse-task --target /restore
   sudo chown -R $USER: /srv/sch-cse-task/restore
   ```
6. 제자리에 놓기:
   ```bash
   R=/srv/sch-cse-task/restore/data
   cp $R/secrets/compose.env .env && cp $R/secrets/backend.env backend.env && chmod 600 .env backend.env
   cp -a $R/ai /srv/sch-cse-task/ai
   cp -a $R/uploads/. /srv/sch-cse-task/data/uploads/
   ```
7. DB 띄우고 복원:
   ```bash
   docker compose up -d db          # 처음 뜰 때 ai_reader 계정이 만들어진다
   docker compose exec -T db pg_restore -U app -d sch --no-owner --no-privileges < $R/db/sch.dump
   docker compose exec -T db psql -U app -d sch < sql/after-restore.sql
   docker compose up -d --build
   ```
8. 터널: Cloudflare → Zero Trust → Networks → Tunnels → `minipc` → 커넥터 설치 명령(Debian)을 새 PC에서 실행. 옛 PC의 커넥터는 대시보드에서 삭제.
9. Tailscale 설치·로그인(전용 계정), 키 만료 해제. 자동 작업 설치: `sudo ./scripts/install_host.sh`
10. `rm -rf /srv/sch-cse-task/restore` (개인정보가 들어 있다)

## 8. 정기 점검 달력

| 시기 | 할 일 |
|---|---|
| 매달 | healthchecks.io에서 세 체크가 초록색인지, 복원 확인 메일 내용(행 수)이 그럴듯한지 |
| 분기 | 5절 "기반 이미지 업데이트". Cloudflare R2 Metrics에서 용량(무료 10GB) 확인 |
| 해마다 3월·9월(학기 초) | 디스크·R2 사용량 추세 확인. 백업 암호 보관처가 그대로인지 확인 |
| **2028-10-07** | **도메인 만료.** Cloudflare 자동 갱신이 켜져 있는지, 결제 카드가 유효한지 미리 확인 (결제 주체를 학과로 옮길 기회) |
| 2028 하반기 | 다음 관리자 지정, 9절 인수인계 |
| 2029-10 | Python 3.13 지원 종료 → `deploy/*.Dockerfile`의 `python:3.13-slim`을 다음 버전으로 올리고 시험 |
| 2030-11 | PostgreSQL 18 지원 종료 → 메이저 업그레이드(덤프·복원) |
| 2031-04 | Ubuntu 26.04 표준 지원 종료 → 다음 LTS로 업그레이드 또는 7절로 새로 설치 |

## 9. 인수인계 체크리스트

- [ ] 서비스 전용 Google 계정 비밀번호·2단계 인증 수단 넘기기
- [ ] Cloudflare: 새 관리자를 Super Administrator로 초대, 도메인 결제 수단 이전
- [ ] GitHub 저장소 관리 권한(또는 학과 조직으로 이전)
- [ ] 새 관리자 PC의 SSH 공개키를 서버에 등록, 이전 관리자 키 삭제(`~/.ssh/authorized_keys`)
- [ ] `task` 계정 비밀번호 변경 후 전달
- [ ] 백업 암호 보관처 확인(학과 보관본 포함)
- [ ] healthchecks.io 알림 메일을 새 관리자 메일로 변경
- [ ] 이 문서를 같이 읽으며 5절 명령을 한 번씩 실행해 보기, 7절 복구를 한 번 연습하기

## 부록: Supabase에서 처음 옮길 때 (1회)

`scripts/migrate_from_supabase.sh` — Supabase DB(public 스키마)와 Storage 첨부파일을 서버로 옮긴다.
서버 DB의 public 스키마를 **지우고** 다시 채우므로 운영 중에는 실행하지 않는다.
옮긴 뒤 표별 행 수를 Supabase와 비교해 출력하고, DB 안에 Supabase 주소가 남았는지 검사한다.

알아 둘 차이:
- 첨부파일은 Supabase Storage 대신 서버 디스크(`data/uploads`)에 저장한다. DB에는 예전처럼 상대 경로만 있어 그대로 쓴다.
- 공결 증빙서류는 공개 경로(`/uploads/absence/...`)로는 열리지 않고, 조교 API가 만들어 주는 60초짜리 서명 링크(`/private-files/...`)로만 열린다.
- Supabase에서 켜 두었던 RLS는 끈다(공개 REST API가 없으므로 불필요, 켜 두면 AI 계정이 0건을 읽음).
- 로그인 실패 제한은 Cloudflare가 넘겨주는 실제 접속자 IP(CF-Connecting-IP) 기준이고, 실패만 센다(`backend/login_guard.py`): 같은 IP·같은 아이디 1분 10회, 같은 IP 전체 1분 30회. 학교 와이파이는 교내 전원이 IP 하나를 쓰므로 한 사람의 실패로 전원이 막히지 않게 나눴다.
