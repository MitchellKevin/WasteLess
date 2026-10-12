const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const path = require('path')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === 'production'

// In production there is no sensible fallback: refuse to start rather than run half-broken
if (isProduction) {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key])
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
}

app.use(cors())
app.use(express.json())

// Atlas connection strings often have no database name; without dbName data would end up in "test"
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wasteless', {
    dbName: process.env.MONGODB_DB || 'wasteless',
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log(`MongoDB connected (${mongoose.connection.host}/${mongoose.connection.name})`))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    // Let Render mark the deploy as failed instead of serving errors
    if (isProduction) process.exit(1)
  })

// Used by Render's health check: only healthy when the database is reachable
app.get('/api/health', (req, res) => {
  const ok = mongoose.connection.readyState === 1
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'database unavailable' })
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/items', require('./routes/items'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/barcodes', require('./routes/barcodes'))
app.use('/api/households', require('./routes/households'))
app.use('/api/billing', require('./routes/billing'))

if (isProduction) {
  const dist = path.join(__dirname, '../client/dist')
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  // Report in the log whether password reset emails can be sent
  require('./lib/mail').checkMail()
})

// Render stops the old instance with SIGTERM on every deploy
process.on('SIGTERM', () => {
  server.close(() => mongoose.connection.close().finally(() => process.exit(0)))
})
