const mongoose = require('mongoose')

const barcodeCacheSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    category: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
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

module.exports = mongoose.model('BarcodeCache', barcodeCacheSchema)
