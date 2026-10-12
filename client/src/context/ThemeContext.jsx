import { createContext, useContext, useState, useEffect } from 'react'
import { setSystemBarsTheme } from '../lib/native'

const ThemeContext = createContext(null)
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readMode() {
  try { return localStorage.getItem('theme') || 'system' } catch { return 'system' }
}

export function ThemeProvider({ children }) {
  // 'system' follows the OS appearance; 'light' / 'dark' override it
  const [mode, setMode] = useState(readMode)
  const [systemDark, setSystemDark] = useState(media.matches)

  useEffect(() => {
    const onChange = (e) => setSystemDark(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const dark = mode === 'system' ? systemDark : mode === 'dark'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    setSystemBarsTheme(dark)
    try { localStorage.setItem('theme', mode) } catch {}
  }, [dark, mode])

  return (
    <ThemeContext.Provider value={{ dark, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
