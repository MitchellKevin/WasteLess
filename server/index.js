const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wasteless')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/items', require('./routes/items'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/barcodes', require('./routes/barcodes'))
app.use('/api/households', require('./routes/households'))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
