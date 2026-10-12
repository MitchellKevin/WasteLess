// Sends email over SMTP (works with Gmail app passwords, Brevo, Resend, SendGrid, Mailgun, …).
// Without SMTP settings, development prints the email to the terminal instead.
const nodemailer = require('nodemailer')

const configured = () => Boolean(process.env.SMTP_HOST)

let transport
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT) || 587
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  }
  return transport
}

async function sendMail({ to, subject, text, html }) {
  if (!configured()) {
    if (process.env.NODE_ENV === 'production') {
      // Never log the contents (it contains a reset link) in production logs
      console.error('[mail] SMTP is not configured; email not sent')
      return
    }
    console.log(`\n[mail] (dev, not sent) To: ${to}\nSubject: ${subject}\n${text}\n`)
    return
  }
  await getTransport().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to, subject, text, html,
  })
}

module.exports = { sendMail, configured }
