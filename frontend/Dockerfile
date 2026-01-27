FROM node:18-alpine

WORKDIR /app

# 라이브러리 설치
COPY package*.json ./
RUN npm install

# 코드 복사
COPY . .

# 실행 (개발 모드 기준)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]