import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'SCH 행정조교 시스템',
        short_name: '행정조교',
        description: '순천향대학교 행정조교 업무 관리 시스템',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#003675',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',      // 모든 네트워크 인터페이스 허용
    port: 5173,           // 도커 내부 포트 고정
    strictPort: true,      // 5173 포트가 사용 중일 때 자동으로 다른 포트로 바뀌지 않게 함
    allowedHosts: true     // 모든 호스트 접속 허용 (보안 해제)
  }
})