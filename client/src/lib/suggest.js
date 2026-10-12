// Smart expiry dates (Plus): asks the server for a date and storage place per product.
import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'

export const inDays = (n) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// [{ name, category?, location?, opened? }] → [suggestion | null]; empty when not available (e.g. no Plus)
export async function fetchSuggestions(items) {
  if (!items.length) return []
  try {
    const { data } = await api.post('/items/suggest', { items })
    return data.suggestions
  } catch {
    return items.map(() => null)
  }
}

// Suggestion for the product being typed, debounced. `location` is only sent once the user picked one.
export function useExpirySuggestion({ name, category, location, enabled }) {
  const [suggestion, setSuggestion] = useState(null)
  const latest = useRef(0)
  useEffect(() => {
    if (!enabled || String(name || '').trim().length < 2) { setSuggestion(null); return }
    const id = ++latest.current
    const timer = setTimeout(async () => {
      const [s] = await fetchSuggestions([{ name, category, location }])
      if (id === latest.current) setSuggestion(s || null)
    }, 450)
    return () => clearTimeout(timer)
  }, [name, category, location, enabled])
  return suggestion
}

// Why this date: "based on your last 3 times" or "typical for this product in the fridge"
export function suggestionReason(t, s) {
  if (!s) return ''
  return s.source === 'history'
    ? t('smart.history', { count: s.count })
    : t('smart.guide', { place: t(`location.${s.location}`).toLowerCase() })
}
