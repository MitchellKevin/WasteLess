import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() // 'ios' | 'android' | 'web'

// Status/navigation bar icons follow the app theme
export function setSystemBarsTheme(dark) {
  if (!isNative) return
  SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {})
}

// External pages (privacy policy, store subscription settings) in the in-app browser
export function openExternal(url) {
  if (!url) return
  if (isNative) Browser.open({ url }).catch(() => {})
  else window.open(url, '_blank', 'noopener')
}

// Legal pages live in the app itself (public routes), so they work in the app and on the web
export const LEGAL = { privacy: '/privacy', terms: '/terms', deleteAccount: '/delete-account' }

export const STORE_LINKS = {
  ios: import.meta.env.VITE_APP_STORE_URL || '',
  android: import.meta.env.VITE_PLAY_STORE_URL || '',
}

export const MANAGE_SUBSCRIPTIONS = {
  app_store: 'https://apps.apple.com/account/subscriptions',
  play_store: 'https://play.google.com/store/account/subscriptions',
}
