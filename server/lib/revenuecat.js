// RevenueCat REST API (v1) — the source of truth for App Store / Google Play subscriptions
const mongoose = require('mongoose')
const User = require('../models/User')

const BASE = process.env.REVENUECAT_API_BASE || 'https://api.revenuecat.com/v1'
const ENTITLEMENT = () => process.env.REVENUECAT_ENTITLEMENT || 'plus'
const configured = () => Boolean(process.env.REVENUECAT_SECRET_KEY)

async function getSubscriber(appUserId) {
  const res = await fetch(`${BASE}/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${process.env.REVENUECAT_SECRET_KEY}` },
  })
  if (!res.ok) throw new Error(`RevenueCat lookup failed (${res.status})`)
  return (await res.json()).subscriber
}

// Copy the user's Plus entitlement from RevenueCat onto our user record.
// The app logs in to RevenueCat with our user id, so app_user_id === User._id.
async function syncUser(userId) {
  if (!mongoose.isValidObjectId(userId)) return null
  const user = await User.findById(userId)
  if (!user) return null
  const subscriber = await getSubscriber(userId)
  const ent = subscriber?.entitlements?.[ENTITLEMENT()]
  if (ent) {
    const sub = subscriber.subscriptions?.[ent.product_identifier] || {}
    // Lifetime entitlements have no expiry
    user.plusUntil = ent.expires_date ? new Date(ent.expires_date) : new Date('2100-01-01')
    user.plusProduct = ent.product_identifier
    user.plusInterval = /year|annual/i.test(ent.product_identifier) ? 'yearly' : 'monthly'
    user.plusStore = sub.store || null
    user.plusCanceled = Boolean(sub.unsubscribe_detected_at)
    if (sub.period_type === 'trial') {
      user.trialUsed = true
      user.trialEndsAt = user.plusUntil
    } else if (user.trialEndsAt && user.trialEndsAt > new Date()) {
      user.trialEndsAt = null
    }
  } else if (user.plusStore) {
    // Entitlement gone (refunded or transferred away)
    user.plusUntil = null
    user.plusCanceled = false
  }
  await user.save()
  return user
}

module.exports = { configured, syncUser }
