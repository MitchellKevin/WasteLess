const mongoose = require('mongoose')

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemName: { type: String, required: true },
    action: { type: String, enum: ['consumed', 'wasted'], required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'item' },
    price: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Log', logSchema)
