// Expiry reminders. In the app: local notifications scheduled on the device.
// In a browser: a notification when the app is opened (browsers can't schedule).
import { LocalNotifications } from '@capacitor/local-notifications'
import { isNative } from './native'
import { daysUntil } from './items'

const REMIND_HOUR = 18 // 6 pm, like the design
const MAX_SCHEDULED = 60 // iOS keeps at most 64 pending notifications

export async function notificationPermission() {
  if (isNative) return (await LocalNotifications.checkPermissions()).display
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission() {
  if (isNative) return (await LocalNotifications.requestPermissions()).display
  return Notification.requestPermission()
}

// Stable numeric id per item so rescheduling replaces instead of duplicating
const idFor = (itemId) => parseInt(String(itemId).slice(-7), 16)

export async function syncReminders(items, daysBefore, t) {
  if (!isNative) {
    const due = items.filter((i) => { const d = daysUntil(i.expiryDate); return d >= 0 && d <= daysBefore })
    if (due.length === 0 || !('Notification' in window) || Notification.permission === 'denied') return
    const show = () => new Notification('WasteLess', {
      body: t('dashboard.expiring', { count: due.length, names: due.slice(0, 3).map((i) => i.name).join(', ') }),
      icon: '/icon.svg',
    })
    if (Notification.permission === 'granted') show()
    else Notification.requestPermission().then((p) => { if (p === 'granted') show() })
    return
  }

  try {
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })

    const now = Date.now()
    const notifications = items
      .map((item) => {
        const at = new Date(item.expiryDate)
        at.setDate(at.getDate() - daysBefore)
        at.setHours(REMIND_HOUR, 0, 0, 0)
        return { item, at }
      })
      .filter(({ at }) => at.getTime() > now)
      .sort((a, b) => a.at - b.at)
      .slice(0, MAX_SCHEDULED)
      .map(({ item, at }) => ({
        id: idFor(item._id),
        title: item.name,
        body: daysBefore === 0 ? t('reminder.today') : t('reminder.soon', { count: daysBefore }),
        schedule: { at, allowWhileIdle: true },
        extra: { itemId: item._id },
      }))
    if (notifications.length) await LocalNotifications.schedule({ notifications })
  } catch { /* reminders are best-effort */ }
}
