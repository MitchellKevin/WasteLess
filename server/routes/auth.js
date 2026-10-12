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
const crypto = require('crypto')
const { sendMail } = require('../lib/mail')

// ── Forgot password ──────────────────────────────────────────────────────────
const RESET_VALID_MS = 60 * 60 * 1000 // 1 hour
const MIN_PASSWORD = 6
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')
const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')

// At most 3 reset emails per address per 15 minutes (in memory; resets on server restart)
const resetRequests = new Map()
function tooManyRequests(email) {
  const now = Date.now(), windowMs = 15 * 60 * 1000
  const recent = (resetRequests.get(email) || []).filter((t) => now - t < windowMs)
  if (recent.length >= 3) return true
  resetRequests.set(email, [...recent, now])
  return false
}

const RESET_MAIL = {
  en: {
    subject: 'Reset your WasteLess password',
    body: (name, link) => [`Hi ${name},`, '', 'Someone (hopefully you) asked to reset the password of your WasteLess account. Choose a new password with this link:', '', link, '', 'The link works once and expires in 1 hour. Didn’t ask for this? Then you can ignore this email; your password stays the same.', '', 'WasteLess'],
    button: 'Choose a new password',
  },
  nl: {
    subject: 'Stel je WasteLess-wachtwoord opnieuw in',
    body: (name, link) => [`Hoi ${name},`, '', 'Iemand (hopelijk jij) heeft gevraagd om het wachtwoord van je WasteLess-account opnieuw in te stellen. Kies een nieuw wachtwoord via deze link:', '', link, '', 'De link werkt één keer en verloopt na 1 uur. Heb je hier niet om gevraagd? Dan kun je deze e-mail negeren; je wachtwoord blijft hetzelfde.', '', 'WasteLess'],
    button: 'Kies een nieuw wachtwoord',
  },
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function resetEmail(lang, name, link) {
  const m = RESET_MAIL[lang] || RESET_MAIL.en
  const lines = m.body(name, link)
  const paragraphs = lines.join('\n').split('\n\n').map((p) =>
    p.trim() === link
      ? `<p><a href="${link}" style="display:inline-block;background:#1F5A3C;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">${m.button}</a></p>`
      : `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
  return {
    subject: m.subject,
    text: lines.join('\n'),
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#1C2B22;max-width:520px">${paragraphs.join('')}</div>`,
  }
}

// Always answers the same, so nobody can find out which emails have an account
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const done = () => res.json({ message: 'If an account exists for this email, a reset link is on its way.' })
  if (!email) return res.status(400).json({ message: 'Email is required' })
  try {
    if (tooManyRequests(email)) return done()
    const user = await User.findOne({ email })
    if (!user) return done()
    const token = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = hashToken(token)
    user.resetTokenExpires = new Date(Date.now() + RESET_VALID_MS)
    await user.save()
    const link = `${appUrl()}/reset-password?token=${token}`
    // Answer first and send afterwards: otherwise the response time would reveal whether the email exists
    done()
    sendMail({ to: user.email, ...resetEmail(req.body.lang === 'nl' ? 'nl' : 'en', user.name, link) })
      .catch((err) => console.error('[forgot-password] email failed:', err.message))
  } catch (err) {
    console.error('[forgot-password]', err.message)
    if (!res.headersSent) res.status(500).json({ message: 'Something went wrong. Please try again later.' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' })
    if (String(password).length < MIN_PASSWORD) return res.status(400).json({ code: 'password_too_short', message: `Password must be at least ${MIN_PASSWORD} characters` })
    const user = await User.findOne({ resetTokenHash: hashToken(String(token)), resetTokenExpires: { $gt: new Date() } })
    if (!user) return res.status(400).json({ code: 'invalid_token', message: 'This link is invalid or has expired' })
    user.password = password // hashed by the model on save
    user.resetTokenHash = null
    user.resetTokenExpires = null
    user.passwordChangedAt = new Date() // logs out all other devices
    await user.save()
    res.json({ token: sign(user), user: await sanitize(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

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
