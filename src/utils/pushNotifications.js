/**
 * Push notification utilities for DayFlow PWA.
 * Handles permission requests, subscription management, and server registration.
 */

const PUSH_SERVER = 'http://localhost:3000'

/**
 * Convert a base64 VAPID key to a Uint8Array for the Web Push API.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check whether push notifications are supported and permission is granted.
 */
export function getPushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported'
  }
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return 'default'
}

/**
 * Request notification permission, subscribe to push, and register with the server.
 * Returns the subscription object on success, null on failure.
 */
export async function subscribeToPush() {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.ready
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

    if (!vapidPublicKey) {
      console.error('[Push] VAPID public key not configured')
      return null
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    // Send subscription to server
    const res = await fetch(`${PUSH_SERVER}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    if (!res.ok) throw new Error('Server rejected subscription')

    return subscription
  } catch (err) {
    console.error('[Push] Subscription failed:', err)
    return null
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }
    return true
  } catch (err) {
    console.error('[Push] Unsubscribe failed:', err)
    return false
  }
}
