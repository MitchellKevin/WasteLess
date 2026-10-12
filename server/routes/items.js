const router = require('express').Router()
const auth = require('../middleware/auth')
const Item = require('../models/Item')
const Log = require('../models/Log')
const householdUserIds = require('../lib/household')
const estimateKg = require('../lib/weight')
const { householdHasPlus, FREE_LIMITS } = require('../lib/plan')
const { suggestExpiry } = require('../lib/suggest')

router.use(auth)

// Fields a client may set; `user` always comes from the token
const pick = (body) => {
  const allowed = ['name', 'barcode', 'category', 'quantity', 'unit', 'expiryDate', 'imageUrl', 'price', 'notes', 'nutrients', 'location', 'openedAt']
  return Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
}

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

// Smart expiry dates (Plus): suggested date and storage place for one or more products.
// Body: { items: [{ name, category?, location?, opened? }] } → { suggestions: [ … | null ] }
router.post('/suggest', async (req, res) => {
  try {
    if (!(await householdHasPlus(req.user.id))) return res.status(402).json({ code: 'plus_required', message: 'Smart expiry dates are part of WasteLess Plus' })
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : []
    const userIds = await householdUserIds(req.user.id)
    const suggestions = await Promise.all(items.map((i) => suggestExpiry(userIds, i)))
    res.json({ suggestions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const items = await Item.find({ user: { $in: userIds } }).sort({ expiryDate: 1 }).populate('user', 'name')
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    // Free plan: limited number of products. Items with the same name are batches of one
    // product, so adding another expiry date of something you already have is always allowed.
    if (!(await householdHasPlus(req.user.id))) {
      const names = await Item.distinct('name', { user: { $in: await householdUserIds(req.user.id) } })
      const products = new Set(names.map((n) => n.trim().toLowerCase()))
      const isNewProduct = !products.has(String(req.body.name || '').trim().toLowerCase())
      if (isNewProduct && products.size >= FREE_LIMITS.items)
        return res.status(402).json({ code: 'limit_items', limit: FREE_LIMITS.items, message: `Free plan holds up to ${FREE_LIMITS.items} products` })
    }
    const item = await Item.create({ ...pick(req.body), user: req.user.id })
    const dateSource = ['manual', 'suggested', 'default'].includes(req.body.dateSource) ? req.body.dateSource : null
    await Log.create({
      user: req.user.id, itemName: item.name, action: 'added',
      quantity: item.quantity, unit: item.unit, category: item.category,
      weightKg: estimateKg(item.quantity, item.unit),
      productKey: item.name.trim().toLowerCase(),
      shelfDays: Math.round((startOfDay(item.expiryDate) - startOfDay(new Date())) / 86400000),
      location: item.location,
      dateSource,
    })
    res.status(201).json(await item.populate('user', 'name'))
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const userIds = await householdUserIds(req.user.id)
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, user: { $in: userIds } },
      pick(req.body),
      { new: true, runValidators: true }
    ).populate('user', 'name')
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
