const router = require('express').Router()
const auth = require('../middleware/auth')
const Household = require('../models/Household')
const User = require('../models/User')

router.use(auth)

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

async function uniqueCode() {
  let code, exists
  do { code = generateCode(); exists = await Household.findOne({ inviteCode: code }) } while (exists)
  return code
}

router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('household')
    if (!user.household) return res.json(null)
    const household = await Household.findById(user.household)
      .populate('members', 'name email')
      .populate('owner', 'name email')
    res.json(household)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (user.household) return res.status(400).json({ message: 'Already in a household' })
    const household = await Household.create({
      name: req.body.name,
      owner: req.user.id,
      members: [req.user.id],
      inviteCode: await uniqueCode(),
    })
    user.household = household._id
    await user.save()
    const populated = await Household.findById(household._id)
      .populate('members', 'name email')
      .populate('owner', 'name email')
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/join', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (user.household) return res.status(400).json({ message: 'Already in a household — leave first' })
    const household = await Household.findOne({ inviteCode: req.body.inviteCode?.toUpperCase() })
    if (!household) return res.status(404).json({ message: 'Invalid invite code' })
    if (!household.members.includes(req.user.id)) {
      household.members.push(req.user.id)
      await household.save()
    }
    user.household = household._id
    await user.save()
    const populated = await Household.findById(household._id)
      .populate('members', 'name email')
      .populate('owner', 'name email')
    res.json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/leave', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user.household) return res.status(400).json({ message: 'Not in a household' })
    const household = await Household.findById(user.household)
    household.members = household.members.filter((m) => m.toString() !== req.user.id)
    if (household.members.length === 0) {
      await Household.deleteOne({ _id: household._id })
    } else {
      if (household.owner.toString() === req.user.id) {
        household.owner = household.members[0]
      }
      await household.save()
    }
    user.household = null
    await user.save()
    res.json({ message: 'Left household' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
