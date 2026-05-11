const mongoose = require('mongoose')

const barcodeCacheSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    category: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('BarcodeCache', barcodeCacheSchema)
