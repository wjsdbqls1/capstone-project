import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// registerType: 'autoUpdate' (vite-plugin-pwa)가 새 SW를 감지하면
// 클라이언트에서 SKIP_WAITING 메시지를 보내는데, injectManifest 커스텀 sw.js는
// 이 메시지를 직접 처리해야 함. 이 리스너가 없으면 새 배포본이 절대 활성화되지 않고
// 기존 탭이 모두 닫히기 전까지 이전 캐시된 번들이 계속 서빙된다.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
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
