#!/bin/sh
# DB 폴더가 비어 있을 때(처음 한 번)만 postgres 이미지가 실행한다.
# AI 서버가 쓸 읽기 전용 계정을 만든다. 표 권한은 표가 생긴 뒤에
# deploy/sql/after-restore.sql 에서 준다(faqs, inquiries만).
# (실행 권한이 없으면 entrypoint가 source로 읽으므로 set -e 같은 셸 옵션은 바꾸지 않는다)
psql -v ON_ERROR_STOP=1 -v pw="$AI_DB_PASSWORD" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE ROLE ai_reader LOGIN PASSWORD :'pw';
GRANT CONNECT ON DATABASE sch TO ai_reader;
GRANT USAGE ON SCHEMA public TO ai_reader;
SQL
