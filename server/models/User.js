const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    notifyDaysBefore: { type: Number, default: 2, min: 0, max: 7 },
    remindersChosen: { type: Boolean, default: false },
    diet: [{ type: String, enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free'] }],
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    monthlyGoal: { type: Number, default: 90, min: 50, max: 100 },
    // WasteLess Plus, bought in the App Store or Google Play (synced via RevenueCat)
    plusUntil: { type: Date, default: null },
    plusInterval: { type: String, enum: ['monthly', 'yearly', null], default: null },
    plusCanceled: { type: Boolean, default: false },
    plusStore: { type: String, default: null },
    plusProduct: { type: String, default: null },
    trialUsed: { type: Boolean, default: false },
    trialEndsAt: { type: Date, default: null },
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', default: null },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', userSchema)
