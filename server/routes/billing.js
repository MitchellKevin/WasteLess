const router = require('express').Router()
const crypto = require('crypto')
const auth = require('../middleware/auth')
const { configured, syncUser } = require('../lib/revenuecat')
const { sanitize } = require('../lib/user')

const requireRevenueCat = (req, res, next) =>
  configured() ? next() : res.status(503).json({ code: 'payments_unavailable', message: 'Purchases are not configured' })

// After a purchase or "Restore purchases" in the app: pull the latest status from RevenueCat
router.post('/sync', auth, requireRevenueCat, async (req, res) => {
  try {
    const user = await syncUser(req.user.id)
    res.json({ user: await sanitize(user) })
  } catch (err) {
    res.status(502).json({ message: err.message })
  }
})

const sameSecret = (a = '', b = '') => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

// RevenueCat webhook. The payload only tells us *who* changed; the status itself is
// re-read from RevenueCat, so a forged or replayed event can't grant Plus.
router.post('/revenuecat', requireRevenueCat, async (req, res) => {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH
  const given = req.headers.authorization || ''
  if (!expected || !(sameSecret(given, expected) || sameSecret(given, `Bearer ${expected}`)))
    return res.sendStatus(401)
  try {
    const e = req.body?.event || {}
    const ids = new Set([e.app_user_id, e.original_app_user_id, ...(e.aliases || []), ...(e.transferred_from || []), ...(e.transferred_to || [])].filter(Boolean))
    for (const id of ids) await syncUser(id)
    res.sendStatus(200)
  } catch {
    res.sendStatus(500) // RevenueCat retries
  }
})

module.exports = router
