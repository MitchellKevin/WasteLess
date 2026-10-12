const User = require('../models/User')
const Household = require('../models/Household')

const FREE_LIMITS = { items: 30, members: 2 }

const hasPlus = (user) => Boolean(user?.plusUntil && user.plusUntil > new Date())

// Plus is shared: one subscriber unlocks it for the whole household
async function householdHasPlus(userId) {
  const user = await User.findById(userId).select('plusUntil household')
  if (!user) return false
  if (hasPlus(user) || !user.household) return hasPlus(user)
  const household = await Household.findById(user.household).select('members')
  if (!household) return false
  return (await User.countDocuments({ _id: { $in: household.members }, plusUntil: { $gt: new Date() } })) > 0
}

module.exports = { FREE_LIMITS, hasPlus, householdHasPlus }
