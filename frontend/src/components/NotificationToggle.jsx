// src/components/NotificationToggle.jsx
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellOff } from 'lucide-react'
import {
  isPushSupported,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '../pushNotifications'

function NotificationToggle({ style, activeStyle }) {
  const [supported, setSupported] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false)
      return
    }
    getPushSubscription().then((sub) => setSubscribed(!!sub))
  }, [])

  const handleClick = async () => {
    setLoading(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
      } else {
        await subscribeToPush()
        setSubscribed(true)
      }
    } catch (e) {
      alert(e.message || '알림 설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      style={{ ...style, display: 'flex', alignItems: 'center', gap: '6px', ...(subscribed ? activeStyle : {}) }}
      onClick={handleClick}
      disabled={loading}
    >
      {subscribed ? <Bell size={15} /> : <BellOff size={15} />}
      {subscribed ? '알림 받는 중' : '알림 받기'}
    </motion.button>
  )
}

export default NotificationToggle
