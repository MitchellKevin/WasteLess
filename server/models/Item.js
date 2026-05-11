const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    category: { type: String, default: 'Other', trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: 'item', trim: true },
    expiryDate: { type: Date, required: true },
    imageUrl: { type: String },
    price: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: '' },
    nutrients: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      salt: Number,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Item', itemSchema)
