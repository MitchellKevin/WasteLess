const jwt = require('jsonwebtoken')
const User = require('../models/User')

// A valid token isn't enough: the account must still exist in this database
// (it may have been deleted, or the token comes from another database).
module.exports = async function (req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token provided' })
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
  try {
    if (!(await User.exists({ _id: payload.id })))
      return res.status(401).json({ code: 'account_not_found', message: 'Account not found' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
  req.user = payload
  next()
}
