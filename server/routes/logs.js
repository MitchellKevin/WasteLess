const router = require('express').Router()
const auth = require('../middleware/auth')
const Log = require('../models/Log')
const User = require('../models/User')
const householdUserIds = require('../lib/household')
const estimateKg = require('../lib/weight')
const { householdHasPlus } = require('../lib/plan')

// Rough average for food waste: ~2.5 kg CO2e per kg of food
const CO2_PER_KG = 2.5

router.use(auth)

const DAY = 86400000
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const dayKey = (d) => startOfDay(d).getTime()

router.post('/', async (req, res) => {
  try {
    const { itemName, action, quantity, unit, price, totalValue, category } = req.body
    const log = await Log.create({
      user: req.user.id, itemName, action, quantity, unit, price, totalValue, category,
      weightKg: estimateKg(quantity, unit),
    })
    res.status(201).json(log)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const logs = await Log.find({ user: { $in: userIds }, action: { $in: ['consumed', 'wasted'] } }).sort({ createdAt: 1 })
    const plus = await householdHasPlus(req.user.id)
    const stats = {}
    for (const log of logs) {
      const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!stats[key]) stats[key] = { consumed: 0, wasted: 0, consumedValue: 0, wastedValue: 0 }
      stats[key][log.action]++
      if (plus) stats[key][`${log.action}Value`] += log.totalValue || 0
    }
    res.json(stats)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Everything the Impact and Goals screens need, for the user's household
router.get('/impact', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const me = await User.findById(req.user.id).select('createdAt monthlyGoal')
    const logs = await Log.find({ user: { $in: userIds } }).sort({ createdAt: 1 })

    const now = new Date()
    const today = startOfDay(now)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const eaten = logs.filter((l) => l.action === 'consumed')
    const wasted = logs.filter((l) => l.action === 'wasted')
    const inRange = (list, from, to) => list.filter((l) => l.createdAt >= from && l.createdAt < to)
    const pct = (e, w) => (e + w === 0 ? null : Math.round((e / (e + w)) * 100))
    const kg = (list) => Math.round(list.reduce((s, l) => s + (l.weightKg || 0), 0) * 10) / 10

    const eatenMonth = inRange(eaten, monthStart, monthEnd)
    const wastedMonth = inRange(wasted, monthStart, monthEnd)

    // Last four 7-day windows, oldest first
    const weeks = [3, 2, 1, 0].map((i) => {
      const to = new Date(today.getTime() + DAY - i * 7 * DAY)
      const from = new Date(to.getTime() - 7 * DAY)
      return { eaten: inRange(eaten, from, to).length, wasted: inRange(wasted, from, to).length }
    })

    // Streaks: consecutive days without a wasted log, counted from account creation
    const since = startOfDay(me.createdAt)
    const wasteDays = [...new Set(wasted.map((l) => dayKey(l.createdAt)))].sort((a, b) => a - b)
    const daysBetween = (a, b) => Math.round((b - a) / DAY)
    const lastWaste = wasteDays[wasteDays.length - 1]
    const streak = lastWaste === undefined
      ? daysBetween(since.getTime(), today.getTime()) + 1
      : daysBetween(lastWaste, today.getTime())
    let best = streak
    let prev = since.getTime() - DAY
    for (const d of wasteDays) { best = Math.max(best, daysBetween(prev, d) - 1); prev = d }

    // Current Monday–Sunday week: clean, wasted, or still to come
    const monday = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY)
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = monday.getTime() + i * DAY
      if (d > today.getTime() || d < since.getTime()) return 'none'
      return wasteDays.includes(d) ? 'wasted' : 'clean'
    })

    const counts = {}
    for (const l of wastedMonth) counts[l.itemName] = (counts[l.itemName] || 0) + 1
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]

    const totalKg = kg(eaten)
    const frozen = logs.filter((l) => l.action === 'frozen').length
    const accountDays = daysBetween(since.getTime(), today.getTime()) + 1

    res.json({
      month: { rescuedKg: kg(eatenMonth), eaten: eatenMonth.length, wasted: wastedMonth.length, eatenPct: pct(eatenMonth.length, wastedMonth.length) },
      lastMonthPct: pct(inRange(eaten, lastMonthStart, monthStart).length, inRange(wasted, lastMonthStart, monthStart).length),
      weeks,
      streak,
      bestStreak: best,
      week,
      mostWasted: top ? { name: top[0], count: top[1] } : null,
      goal: { target: me.monthlyGoal, daysLeft: daysBetween(today.getTime(), monthEnd.getTime()) },
      badges: {
        firstWeek: accountDays >= 7 && eaten.length > 0,
        zeroWasteWeek: best >= 7 && eaten.length > 0,
        kg10: totalKg >= 10,
        streak30: best >= 30 && eaten.length > 0,
        freezerHero: frozen >= 5,
        kg25: totalKg >= 25,
      },
      totalRescuedKg: totalKg,
      // Money and CO2 are Plus-only
      report: (await householdHasPlus(req.user.id))
        ? {
            savedEur: Math.round(eatenMonth.reduce((s, l) => s + (l.totalValue || 0), 0) * 100) / 100,
            lostEur: Math.round(wastedMonth.reduce((s, l) => s + (l.totalValue || 0), 0) * 100) / 100,
            co2SavedKg: Math.round(kg(eatenMonth) * CO2_PER_KG * 10) / 10,
            co2LostKg: Math.round(kg(wastedMonth) * CO2_PER_KG * 10) / 10,
          }
        : null,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
