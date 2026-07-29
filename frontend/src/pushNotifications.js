// src/pushNotifications.js
import axios from 'axios'

const API = 'https://capstone-project-of74.onrender.com'

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

export async function subscribeToPush() {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('알림 권한이 거부되었습니다.')
  }

  const { data } = await axios.get(`${API}/push/vapid-public-key`)
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
