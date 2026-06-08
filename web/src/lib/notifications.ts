/**
 * Local notification helpers for scheduled-slot reminders.
 *
 * This fires reminders while the app is open or backgrounded (via the service
 * worker registration). Delivery when the app is fully closed requires Web Push
 * (VAPID + a push server) — see web/README.md → "Reminders & notifications" for
 * the scaffolding and why it needs a backend.
 */

export const notificationsSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied'
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Show a notification through the service worker when possible (more reliable). */
export async function showReminder(title: string, body: string): Promise<void> {
  if (notificationPermission() !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/favicon.svg',
        tag: 'momentum-reminder',
      })
      return
    }
  } catch {
    // fall through to the page-level Notification
  }
  new Notification(title, { body, icon: '/icon.svg' })
}
