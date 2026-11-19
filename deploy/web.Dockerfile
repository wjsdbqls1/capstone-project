# 학과 서버용 프론트 이미지. 빌드 컨텍스트는 frontend/ (docker-compose.yml 참고)
# 1단계에서 정적 파일을 빌드하고, 2단계는 Caddy로 그 파일만 내보낸다.
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite는 .env.production보다 실행 환경의 변수를 우선하므로 여기서 넣은 주소가 쓰인다
ARG VITE_API_BASE
ARG VITE_AI_BASE
ARG VITE_AI_REPORT_BASE
ENV VITE_API_BASE=$VITE_API_BASE \
    VITE_AI_BASE=$VITE_AI_BASE \
    VITE_AI_REPORT_BASE=$VITE_AI_REPORT_BASE
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /src/dist /srv
