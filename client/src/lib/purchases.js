// In-app purchases through RevenueCat (App Store / Google Play). Native only.
import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor'
import { isNative, platform } from './native'

const API_KEY = platform === 'ios' ? import.meta.env.VITE_REVENUECAT_IOS_KEY : import.meta.env.VITE_REVENUECAT_ANDROID_KEY

export const purchasesAvailable = isNative && Boolean(API_KEY)

let ready = null
let currentUser = null

// RevenueCat knows each customer by our user id, so the server can look them up
export async function identify(userId) {
  if (!purchasesAvailable || !userId || String(userId) === currentUser) return
  const id = String(userId)
  if (!ready) ready = Purchases.configure({ apiKey: API_KEY, appUserID: id })
  else { await ready; await Purchases.logIn({ appUserID: id }) }
  await ready
  currentUser = id
}

export async function forget() {
  if (!purchasesAvailable || !ready || !currentUser) return
  currentUser = null
  try { await Purchases.logOut() } catch { /* already anonymous */ }
}

export async function getPlans() {
  await ready
  const offerings = await Purchases.getOfferings()
  const current = offerings.current
  return { yearly: current?.annual || null, monthly: current?.monthly || null }
}

// Resolves to true when bought, false when the user cancelled the store sheet
export async function buy(pkg) {
  await ready
  try {
    await Purchases.purchasePackage({ aPackage: pkg })
    return true
  } catch (err) {
    if (err?.userCancelled || err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return false
    throw err
  }
}

export async function restore() {
  await ready
  await Purchases.restorePurchases()
}

export async function managementUrl() {
  await ready
  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo.managementURL
}
