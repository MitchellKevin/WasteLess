// Sends email over SMTP (works with Gmail app passwords, Brevo, Resend, SendGrid, Mailgun, …).
// Without SMTP settings, development prints the email to the terminal instead.
const nodemailer = require('nodemailer')

// Values pasted into a hosting dashboard often keep the quotes from an example file
const clean = (value) => String(value || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim()

function settings() {
  const host = clean(process.env.SMTP_HOST)
  let pass = clean(process.env.SMTP_PASS)
  // Google shows app passwords in groups of four ("abcd efgh ijkl mnop"); the spaces aren't part of it
  if (/gmail\.com$/i.test(host)) pass = pass.replace(/\s+/g, '')
  const user = clean(process.env.SMTP_USER)
  return {
    host,
    port: Number(clean(process.env.SMTP_PORT)) || 587,
    user,
    pass,
    from: clean(process.env.MAIL_FROM) || user,
  }
}

const configured = () => Boolean(settings().host)

let transport
function getTransport() {
  if (!transport) {
    const { host, port, user, pass } = settings()
    transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    })
  }
  return transport
}

// Logs at startup whether email works, with the reason when it doesn't (never the password)
async function checkMail() {
  if (!configured()) {
    console.log('Mail: not configured (SMTP_HOST is empty), password reset emails will not be sent')
    return
  }
  const { host, port, user, pass, from } = settings()
  const problems = []
  if (!user) problems.push('SMTP_USER is empty')
  if (!pass) problems.push('SMTP_PASS is empty')
  if (/gmail\.com$/i.test(host) && pass && pass.length !== 16) problems.push(`SMTP_PASS has ${pass.length} characters; a Gmail app password has 16`)
  if (!/<?[^@\s<>]+@[^@\s<>]+>?$/.test(from)) problems.push('MAIL_FROM must end with an email address, e.g. WasteLess <you@gmail.com>')
  if (problems.length) console.error(`Mail: settings look wrong: ${problems.join('; ')}`)
  try {
    await getTransport().verify()
    console.log(`Mail: SMTP ready (${host}:${port} as ${user}, from ${from})`)
  } catch (err) {
    console.error(`Mail: SMTP login failed (${host}:${port} as ${user}): ${err.message}`)
  }
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
  await getTransport().sendMail({ from: settings().from, to, subject, text, html })
}

module.exports = { sendMail, configured, checkMail }
