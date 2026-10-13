// Gives an account WasteLess Plus for testing, without a store purchase.
//   node server/scripts/grant-plus.js you@example.com          → Plus for 30 days
//   node server/scripts/grant-plus.js you@example.com 365      → Plus for 365 days
//   node server/scripts/grant-plus.js you@example.com --revoke → back to the free plan
// Uses MONGODB_URI (and MONGODB_DB) from server/.env, so it changes that database.
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const User = require('../models/User')

const [email, daysArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const revoke = process.argv.includes('--revoke')

async function main() {
  if (!email) throw new Error('Usage: node server/scripts/grant-plus.js <email> [days] [--revoke]')
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wasteless', {
    dbName: process.env.MONGODB_DB || 'wasteless',
    serverSelectionTimeoutMS: 15000,
  })
  console.log(`Database: ${mongoose.connection.host}/${mongoose.connection.name}`)
  const user = await User.findOne({ email: email.trim().toLowerCase() })
  if (!user) throw new Error(`No account with email ${email}`)

  if (revoke) {
    user.plusUntil = null
    user.plusCanceled = false
    user.plusInterval = null
  } else {
    const days = Number(daysArg) || 30
    user.plusUntil = new Date(Date.now() + days * 86400000)
    user.plusCanceled = true // a test grant: shows "ends on", never "renews"
    user.plusInterval = null
  }
  await user.save()
  console.log(revoke
    ? `${user.email} is back on the free plan.`
    : `${user.email} has Plus until ${user.plusUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Reload the app to see it.`)
}

main()
  .catch((err) => { console.error(`✖ ${err.message}`); process.exitCode = 1 })
  .finally(() => mongoose.disconnect())
