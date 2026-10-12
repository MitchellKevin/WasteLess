const User = require('../models/User')
const Household = require('../models/Household')

// Everyone whose items and logs the user shares: their household, or just themselves
module.exports = async function householdUserIds(userId) {
  const user = await User.findById(userId).select('household')
  if (!user?.household) return [userId]
  const household = await Household.findById(user.household).select('members')
  return household ? household.members : [userId]
}
