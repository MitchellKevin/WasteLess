import api from '../api/axios'

const MS_PER_DAY = 86400000

export const LOCATIONS = ['fridge', 'freezer', 'cupboard']

export function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr); exp.setHours(0, 0, 0, 0)
  return Math.round((exp - now) / MS_PER_DAY)
}

export function urgency(days) {
  if (days < 0) return 'expired'
  if (days <= 1) return 'urgent'
  if (days <= 7) return 'warning'
  return 'ok'
}

// Short label for pills: "Today", "Tomorrow", "In 3 days", "2 days ago"
export function expiryLabel(t, days) {
  if (days < 0) return t('item.expiredAgo', { count: Math.abs(days) })
  if (days === 0) return t('item.today')
  if (days === 1) return t('item.tomorrow')
  return t('item.inDays', { count: days })
}

// Share of shelf life left. Shelf life counts as at least a week, so something
// added yesterday that expires tomorrow still reads as nearly gone.
export function freshness(item) {
  const left = new Date(item.expiryDate) - Date.now()
  const total = Math.max(new Date(item.expiryDate) - new Date(item.createdAt || Date.now()), 7 * MS_PER_DAY)
  if (left <= 0) return 0
  return Math.max(3, Math.min(100, Math.round((left / total) * 100)))
}

export function formatWeight(kg, units) {
  if (units === 'imperial') return { value: (kg * 2.20462).toFixed(1), unit: 'lb' }
  return { value: kg.toFixed(1), unit: 'kg' }
}

export function formatDate(d, lang, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(d).toLocaleDateString(lang, opts)
}

// Remove an item and record whether it was eaten or thrown away
export async function finishItem(item, action) {
  await api.post('/logs', {
    itemName: item.name, action, quantity: item.quantity, unit: item.unit, category: item.category,
    price: item.price || 0, totalValue: (item.price || 0) * item.quantity,
  })
  await api.delete(`/items/${item._id}`)
}

// Move to the freezer: frozen food keeps for about three months
export async function freezeItem(item) {
  const expiry = new Date(Math.max(Date.now(), new Date(item.expiryDate).getTime()) + 90 * MS_PER_DAY)
  const { data } = await api.patch(`/items/${item._id}`, { location: 'freezer', expiryDate: expiry.toISOString().slice(0, 10) })
  await api.post('/logs', { itemName: item.name, action: 'frozen', quantity: item.quantity, unit: item.unit, category: item.category })
  return data
}

export function openedLabel(t, openedAt) {
  const ago = Math.max(0, -daysUntil(openedAt))
  return ago === 0 ? t('item.openedToday') : t('item.openedAgo', { count: ago })
}

export function remindLabel(t, days) {
  return days === 0 ? t('notifications.sameDay') : t('notifications.before', { count: days })
}
