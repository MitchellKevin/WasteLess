const router = require('express').Router()
const auth = require('../middleware/auth')
const BarcodeCache = require('../models/BarcodeCache')

router.use(auth)

router.get('/:code', async (req, res) => {
  try {
    const entry = await BarcodeCache.findOne({ barcode: req.params.code })
    if (!entry) return res.status(404).json({ message: 'Not cached' })
    res.json(entry)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const entry = await BarcodeCache.findOneAndUpdate(
      { barcode: req.body.barcode },
      req.body,
      { upsert: true, new: true }
    )
    res.json(entry)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
