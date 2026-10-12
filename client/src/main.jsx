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

// The installed app ships its own files; the service worker is only for the web version
if (!isNative && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
