import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './setupAxios'   // API 요청에 토큰을 자동으로 붙인다 (App보다 먼저 실행되어야 함)
import App from './App.jsx'

// 새 배포본 확인은 기본적으로 페이지를 새로 열 때만 일어난다. 휴대폰 홈 화면 앱은
// 백그라운드에 살아 있다가 그대로 다시 켜지는 경우가 많아 확인 자체가 안 일어나므로,
// 앱이 다시 화면에 보일 때마다 확인한다(너무 잦지 않게 1분 간격).
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    let lastCheck = Date.now()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastCheck < 60 * 1000) return
      lastCheck = Date.now()
      registration.update().catch(() => {})
    })
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
