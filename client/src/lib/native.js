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

export const LEGAL = {
  privacy: import.meta.env.VITE_PRIVACY_URL || '',
  // Apple's standard EULA unless you publish your own terms
  terms: import.meta.env.VITE_TERMS_URL || 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
}

export const STORE_LINKS = {
  ios: import.meta.env.VITE_APP_STORE_URL || '',
  android: import.meta.env.VITE_PLAY_STORE_URL || '',
}

export const MANAGE_SUBSCRIPTIONS = {
  app_store: 'https://apps.apple.com/account/subscriptions',
  play_store: 'https://play.google.com/store/account/subscriptions',
}
