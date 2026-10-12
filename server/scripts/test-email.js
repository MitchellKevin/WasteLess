// Sends a test email with the SMTP settings from server/.env (or the environment).
//   node server/scripts/test-email.js you@example.com
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { checkMail, sendMail, configured } = require('../lib/mail')

const to = process.argv[2]
;(async () => {
  if (!to) { console.error('Usage: node server/scripts/test-email.js you@example.com'); process.exit(1) }
  if (!configured()) { console.error('Set BREVO_API_KEY or SMTP_HOST in server/.env'); process.exit(1) }
  await checkMail()
  try {
    await sendMail({ to, subject: 'WasteLess test email', text: 'If you can read this, WasteLess can send email.' })
    console.log(`Test email sent to ${to}. Check your inbox (and spam).`)
  } catch (err) {
    console.error(`Sending failed: ${err.message}`)
    process.exitCode = 1
  }
})()
