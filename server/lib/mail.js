// Sends email, either through Brevo's HTTPS API (BREVO_API_KEY; works on hosts that block SMTP,
// like Render's free plan) or over SMTP (Gmail app password, Brevo SMTP, Resend, SendGrid, …).
// Without either, development prints the email to the terminal instead.
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

const brevoKey = () => clean(process.env.BREVO_API_KEY)
const configured = () => Boolean(brevoKey() || settings().host)

let transport
function getTransport() {
  if (!transport) {
    const { host, port, user, pass } = settings()
    transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
      // Fail within seconds instead of hanging (e.g. when the host blocks outgoing SMTP)
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  }
  return transport
}

// "WasteLess <you@gmail.com>" → { name: 'WasteLess', email: 'you@gmail.com' }
function parseFrom(from) {
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from)
  return m ? { name: m[1] || 'WasteLess', email: m[2].trim() } : { name: 'WasteLess', email: from.trim() }
}

async function brevo(method, path, body) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: { 'api-key': brevoKey(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Brevo ${res.status}`)
  return data
}

// Logs at startup whether email works, with the reason when it doesn't (never the password)
async function checkMail() {
  if (!configured()) {
    console.log('Mail: not configured (no BREVO_API_KEY or SMTP_HOST), password reset emails will not be sent')
    return
  }
  if (brevoKey()) {
    const from = clean(process.env.MAIL_FROM)
    if (!from) console.error('Mail: MAIL_FROM is empty; Brevo needs a sender, e.g. WasteLess <you@gmail.com> (verified in Brevo)')
    try {
      const account = await brevo('GET', '/account')
      console.log(`Mail: Brevo API ready (account ${account.email}, from ${from})`)
    } catch (err) {
      console.error(`Mail: Brevo API key rejected: ${err.message}`)
    }
    return
  }
  const { host, port, user, pass, from } = settings()
  console.log(`Mail: checking SMTP connection to ${host}:${port}…`)
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
    const blocked = /timeout|ETIMEDOUT|ECONNREFUSED|ENETUNREACH/i.test(`${err.code} ${err.message}`)
    console.error(`Mail: SMTP failed (${host}:${port} as ${user}): ${err.message}` +
      (blocked ? ' — the host may block outgoing SMTP (Render\'s free plan does); use BREVO_API_KEY instead' : ''))
  }
}

async function sendMail({ to, subject, text, html }) {
  if (!configured()) {
    if (process.env.NODE_ENV === 'production') {
      // Never log the contents (it contains a reset link) in production logs
      console.error('[mail] Email is not configured; email not sent')
      return
    }
    console.log(`\n[mail] (dev, not sent) To: ${to}\nSubject: ${subject}\n${text}\n`)
    return
  }
  if (brevoKey()) {
    const sender = parseFrom(clean(process.env.MAIL_FROM))
    await brevo('POST', '/smtp/email', { sender, to: [{ email: to }], subject, textContent: text, htmlContent: html || `<pre>${text}</pre>` })
    return
  }
  await getTransport().sendMail({ from: settings().from, to, subject, text, html })
}

module.exports = { sendMail, configured, checkMail }
