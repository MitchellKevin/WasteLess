const mongoose = require('mongoose')

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemName: { type: String, required: true },
    action: { type: String, enum: ['consumed', 'wasted', 'added', 'frozen'], required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'item' },
    price: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    weightKg: { type: Number, default: 0 },
    category: { type: String, default: '' },
    // For "added": how many days until the expiry date the user chose, where, and whether they
    // picked it themselves (only "manual" dates teach smart expiry dates)
    productKey: { type: String, default: '', index: true },
    shelfDays: { type: Number, default: null },
    location: { type: String, default: null },
    dateSource: { type: String, enum: ['manual', 'suggested', 'default', null], default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Log', logSchema)
