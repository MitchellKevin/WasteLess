const router = require('express').Router()
const auth = require('../middleware/auth')
const Log = require('../models/Log')
const User = require('../models/User')
const Household = require('../models/Household')

router.use(auth)

async function householdUserIds(userId) {
  const user = await User.findById(userId).select('household')
  if (!user.household) return [userId]
  const household = await Household.findById(user.household).select('members')
  return household ? household.members : [userId]
}

router.post('/', async (req, res) => {
  try {
    const log = await Log.create({ ...req.body, user: req.user.id })
    res.status(201).json(log)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const logs = await Log.find({ user: { $in: userIds } }).sort({ createdAt: 1 })
    const stats = {}
    for (const log of logs) {
      const key = `${log.createdAt.getFullYear()}-${String(log.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!stats[key]) stats[key] = { consumed: 0, wasted: 0, consumedValue: 0, wastedValue: 0 }
      stats[key][log.action]++
      stats[key][`${log.action}Value`] += log.totalValue || 0
    }
    res.json(stats)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
