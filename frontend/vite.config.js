import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // 모든 네트워크 인터페이스 허용
    port: 5173,           // 도커 내부 포트 고정
    strictPort: true,      // 5173 포트가 사용 중일 때 자동으로 다른 포트로 바뀌지 않게 함
    allowedHosts: true     // 모든 호스트 접속 허용 (보안 해제)
  }
})