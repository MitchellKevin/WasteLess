const jwt = require('jsonwebtoken')
const User = require('../models/User')

// A valid token isn't enough: the account must still exist in this database (it may have been
// deleted, or the token comes from another database), and the token must be newer than the
// last password reset.
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
    const user = await User.findById(payload.id).select('passwordChangedAt').lean()
    if (!user) return res.status(401).json({ code: 'account_not_found', message: 'Account not found' })
    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000)
      return res.status(401).json({ code: 'session_expired', message: 'Password was changed, please log in again' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
  req.user = payload
  next()
}
