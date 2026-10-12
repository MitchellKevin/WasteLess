const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const auth = require('../middleware/auth')
const Item = require('../models/Item')
const Log = require('../models/Log')
const Household = require('../models/Household')

const sign = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const { sanitize } = require('../lib/user')

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' })
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already in use' })
    const user = await User.create({ name, email, password })
    res.status(201).json({ token: sign(user), user: await sanitize(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' })
    res.json({ token: sign(user), user: await sanitize(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(await sanitize(user))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Profile and preferences; password changes are not handled here
router.patch('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const { name, email, notifyDaysBefore, diet, units, monthlyGoal } = req.body
    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      if (await User.findOne({ email: email.toLowerCase().trim() }))
        return res.status(400).json({ message: 'Email already in use' })
      user.email = email
    }
    if (name !== undefined) user.name = name
    if (notifyDaysBefore !== undefined) { user.notifyDaysBefore = notifyDaysBefore; user.remindersChosen = true }
    if (diet !== undefined) user.diet = diet
    if (units !== undefined) user.units = units
    if (monthlyGoal !== undefined) user.monthlyGoal = monthlyGoal
    await user.save()
    res.json(await sanitize(user))
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Delete the account and everything that belongs to it (required by the App Store).
// A store subscription is billed by Apple/Google and has to be cancelled there.
router.delete('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.household) {
      const household = await Household.findById(user.household)
      if (household) {
        household.members = household.members.filter((m) => m.toString() !== req.user.id)
        if (household.members.length === 0) await Household.deleteOne({ _id: household._id })
        else {
          if (household.owner.toString() === req.user.id) household.owner = household.members[0]
          await household.save()
        }
      }
    }
    await Item.deleteMany({ user: user._id })
    await Log.deleteMany({ user: user._id })
    await User.deleteOne({ _id: user._id })
    res.json({ message: 'Account deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
