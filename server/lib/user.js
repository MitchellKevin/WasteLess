const { hasPlus, householdHasPlus, FREE_LIMITS } = require('./plan')

// The user as the client sees it, including Plus status for them and their household
async function sanitize(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    household: user.household,
    notifyDaysBefore: user.notifyDaysBefore,
    remindersChosen: user.remindersChosen,
    diet: user.diet,
    units: user.units,
    monthlyGoal: user.monthlyGoal,
    createdAt: user.createdAt,
    plus: {
      active: await householdHasPlus(user._id),
      own: hasPlus(user),
      until: user.plusUntil,
      interval: user.plusInterval,
      canceled: user.plusCanceled,
      store: user.plusStore,
      trialEndsAt: user.trialEndsAt,
    },
    limits: FREE_LIMITS,
  }
}

module.exports = { sanitize }
