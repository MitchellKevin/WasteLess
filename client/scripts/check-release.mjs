// Checks the production settings before building the Android/iOS release.
import { readFileSync, existsSync } from 'node:fs'

const env = Object.fromEntries(
  (existsSync('.env.app') ? readFileSync('.env.app', 'utf8') : '')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const platform = process.argv[2] || 'android'
const errors = [], warnings = []

if (!/^https:\/\/[^/]+[^/]$/.test(env.VITE_API_URL || ''))
  errors.push('VITE_API_URL in .env.app must be your https server address without a trailing slash (the app has no server of its own).')
const rcKey = platform === 'ios' ? 'VITE_REVENUECAT_IOS_KEY' : 'VITE_REVENUECAT_ANDROID_KEY'
if (!env[rcKey]) warnings.push(`${rcKey} is empty: the app works, but Plus can't be bought ("The store isn't available").`)
if (platform === 'android' && !existsSync('android/keystore.properties'))
  errors.push('android/keystore.properties is missing, so the release can\'t be signed for Google Play.')

for (const w of warnings) console.warn(`⚠ ${w}`)
for (const e of errors) console.error(`✖ ${e}`)
if (errors.length) process.exit(1)
console.log(`✔ Release settings OK (${env.VITE_API_URL})`)
