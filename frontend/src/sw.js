import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// 새 배포본이 설치되면 기다리지 않고 바로 교체한다.
// vite-plugin-pwa의 autoUpdate 모드는 페이지가 SKIP_WAITING 메시지를 보내지 않는다
// (1.3.0 register.js: `if (!auto) sendSkipWaitingMessage()`). 교체는 SW가 스스로 해야 하고,
// 교체가 끝나면 페이지 쪽 'activated' 리스너가 새로고침한다.
// 예전처럼 메시지를 받아야만 교체하게 두면 새 SW가 대기 상태로 남아, 앱을 완전히
// 닫기 전까지 옛 index.html과 옛 번들이 캐시에서 계속 나온다(폰에서 새로고침해도 안 바뀌던 원인).
self.addEventListener('install', () => {
  self.skipWaiting()
})

clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: '알림', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'SCH 행정조교 시스템'
  // HashRouter를 사용하므로 경로는 '#/...' 형태로 이동해야 함
  const path = data.url || '/'
  const url = new URL(`#${path}`, self.registration.scope).href

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || self.registration.scope

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) client.navigate(url)
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
