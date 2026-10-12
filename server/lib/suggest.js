// Smart expiry dates: first the household's own habit for this product, then the shelf-life guide.
const Log = require('../models/Log')
const { guideFor } = require('./shelfLife')

const MIN_HISTORY = 2 // need at least this many dates you chose yourself before trusting your habit

const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b)
  return s[Math.floor((s.length - 1) / 2)]
}

async function suggestExpiry(userIds, { name, category, location, opened } = {}) {
  const key = String(name || '').trim().toLowerCase()
  if (key.length < 2) return null
  const guide = guideFor(name, { category, location, opened })
  const place = location || guide?.location || null

  if (!opened) {
    // Your own dates for this product (in this storage place, if known), most recent first
    const history = await Log.find({
      user: { $in: userIds }, action: 'added', productKey: key, dateSource: 'manual',
      shelfDays: { $gt: 0 }, ...(place ? { location: place } : {}),
    }).sort({ createdAt: -1 }).limit(5).select('shelfDays location').lean()
    if (history.length >= MIN_HISTORY) {
      return { days: median(history.map((h) => h.shelfDays)), location: place || history[0].location, source: 'history', count: history.length, type: guide?.type || null }
    }
  }
  if (!guide) return null
  return { days: guide.days, location: guide.location, source: 'guide', type: guide.type, openedDays: guide.openedDays }
}

module.exports = { suggestExpiry }
