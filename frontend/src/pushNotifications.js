import { API_BASE } from './config';
// src/pushNotifications.js
import axios from 'axios'

const API = API_BASE

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export async function getPushSubscription() {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export function getPermission() {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

const BLOCKED_MSG =
  '이 사이트의 알림이 브라우저에서 차단되어 있습니다.\n\n' +
  '주소창 왼쪽의 자물쇠(또는 ⓘ) 아이콘 → 알림 → "허용"으로 바꾼 뒤 ' +
  '새로고침하고 다시 눌러주세요.\n\n' +
  '알림을 켜지 않아도 화면 위쪽 종 아이콘에서 지난 알림을 볼 수 있습니다.'

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('이 브라우저는 알림을 지원하지 않습니다.')
  }

  // 이미 차단된 상태면 requestPermission()이 창을 띄우지 않고 바로 거부를 반환한다.
  // 그대로 두면 "왜 눌러도 아무것도 안 뜨지?"가 되므로 먼저 구분해서 안내한다.
  if (Notification.permission === 'denied') {
    throw new Error(BLOCKED_MSG)
  }

  const permission = await Notification.requestPermission()
  if (permission === 'denied') {
    throw new Error(BLOCKED_MSG)
  }
  if (permission !== 'granted') {
    throw new Error('알림 권한 요청이 취소되었습니다. 다시 시도해 주세요.')
  }

  const { data } = await axios.get(`${API}/push/vapid-public-key`)
  if (!data || !data.publicKey) {
    throw new Error('서버에 알림 설정이 되어 있지 않습니다. 관리자에게 문의해 주세요.')
  }
  const reg = await navigator.serviceWorker.ready

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey),
  })

  const token = localStorage.getItem('token')
  await axios.post(`${API}/push/subscribe`, subscription.toJSON(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  return subscription
}

export async function unsubscribeFromPush() {
  const subscription = await getPushSubscription()
  if (!subscription) return

  const token = localStorage.getItem('token')
  await axios.post(
    `${API}/push/unsubscribe`,
    { endpoint: subscription.endpoint },
    { headers: { Authorization: `Bearer ${token}` } }
  )

  await subscription.unsubscribe()
}
