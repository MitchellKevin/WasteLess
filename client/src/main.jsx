import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts ship with the app (works offline, no third-party requests); the latin subset covers EN and NL
import '@fontsource/bricolage-grotesque/latin-500.css'
import '@fontsource/bricolage-grotesque/latin-700.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-700.css'
import './i18n/index.js'
import './index.css'
import App from './App.jsx'
import { isNative } from './lib/native'
import { hideSplash } from './lib/splash'

// The service worker caches files for the published web version only. In the installed
// app it isn't needed, and during development it would serve stale files, so remove it there.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD && !isNative) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
    if ('caches' in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// The first frame is rendered behind the splash; fade it out on the next one
requestAnimationFrame(() => requestAnimationFrame(hideSplash))
