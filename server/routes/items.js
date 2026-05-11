const router = require('express').Router()
const auth = require('../middleware/auth')
const Item = require('../models/Item')
const User = require('../models/User')
const Household = require('../models/Household')

router.use(auth)

async function householdUserIds(userId) {
  const user = await User.findById(userId).select('household')
  if (!user.household) return [userId]
  const household = await Household.findById(user.household).select('members')
  return household ? household.members : [userId]
}

router.get('/', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const items = await Item.find({ user: { $in: userIds } }).sort({ expiryDate: 1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const item = await Item.create({ ...req.body, user: req.user.id })
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: { $in: userIds } },
      req.body,
      { new: true, runValidators: true }
    )
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const item = await Item.findOneAndDelete({ _id: req.params.id, user: { $in: userIds } })
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
