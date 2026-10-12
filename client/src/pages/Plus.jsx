import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../lib/items'
import { isNative, platform, openExternal, LEGAL, STORE_LINKS, MANAGE_SUBSCRIPTIONS } from '../lib/native'
import { purchasesAvailable, getPlans, buy, restore, managementUrl } from '../lib/purchases'
import { CloseIcon, CheckIcon, LeafIcon } from '../components/Icons'

const FEATURES = ['smart', 'receipt', 'bulk', 'unlimited', 'report']
const STORE_OF_PLATFORM = { ios: 'app_store', android: 'play_store' }

// "7 days free" from the store's introductory offer, if it is a free trial
function trialText(t, product) {
  const intro = product?.introPrice
  if (!intro || intro.price > 0) return null
  const unit = String(intro.periodUnit || 'DAY').toLowerCase()
  return t(`plus.trial.${unit}`, { count: intro.periodNumberOfUnits || 1 })
}

function Status({ plus, onSynced }) {
  const { t, i18n } = useTranslation()
  const until = plus.until ? formatDate(plus.until, i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const inTrial = plus.trialEndsAt && new Date(plus.trialEndsAt) > new Date()
  const boughtHere = isNative && plus.store === STORE_OF_PLATFORM[platform]

  const manage = async () => {
    let url = null
    if (boughtHere && purchasesAvailable) url = await managementUrl().catch(() => null)
    openExternal(url || MANAGE_SUBSCRIPTIONS[plus.store])
    onSynced?.()
  }

  if (!plus.own) {
    return <section className="card plus-status"><h2 className="card-title">{t('plus.sharedTitle')}</h2><p className="card-note">{t('plus.sharedDesc')}</p></section>
  }
  return (
    <section className="card plus-status" aria-labelledby="plus-status-title">
      <h2 className="card-title" id="plus-status-title">{t('plus.activeTitle')}</h2>
      <p className="card-note">
        {plus.canceled ? t('plus.endsOn', { date: until }) : inTrial ? t('plus.trialUntil', { date: until }) : t('plus.renewsOn', { date: until })}
        {plus.interval && ` · ${t(`plus.${plus.interval}`)}`}
      </p>
      {plus.store && (
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={manage}>{t('plus.manage')}</button>
          {!boughtHere && <p className="form-hint">{t(`plus.manageElsewhere.${plus.store}`)}</p>}
        </>
      )}
    </section>
  )
}

function Legal() {
  const { t } = useTranslation()
  return (
    <p className="form-hint plus-legal">
      <Link className="text-link" to={LEGAL.terms}>{t('legal.terms')}</Link>
      {' · '}
      <Link className="text-link" to={LEGAL.privacy}>{t('legal.privacy')}</Link>
    </p>
  )
}

export default function Plus() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState(null)
  const [plan, setPlan] = useState('yearly')
  const [loading, setLoading] = useState(purchasesAvailable)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const plus = user?.plus || {}

  useEffect(() => {
    if (!purchasesAvailable) return
    getPlans()
      .then((p) => { setPlans(p); if (!p.yearly && p.monthly) setPlan('monthly') })
      .catch(() => setError(t('plus.storeUnavailable')))
      .finally(() => setLoading(false))
  }, [])

  // The server re-reads the subscription from RevenueCat; the app never decides Plus itself
  const sync = async () => {
    const { data } = await api.post('/billing/sync')
    setUser(data.user)
    return data.user
  }

  const run = async (fn) => {
    setBusy(true); setError(''); setNote('')
    try { await fn() }
    catch (err) { setError(err.response?.data?.message || err.message || t('common.error')) }
    finally { setBusy(false) }
  }

  const purchase = () => run(async () => {
    const bought = await buy(plans[plan])
    if (!bought) return
    const fresh = await sync()
    setNote(fresh.plus.active ? t('plus.welcome') : t('plus.processing'))
  })

  const restorePurchases = () => run(async () => {
    await restore()
    const fresh = await sync()
    setNote(fresh.plus.active ? t('plus.restored') : t('plus.nothingToRestore'))
  })

  const selected = plans?.[plan]?.product
  const trial = trialText(t, selected)
  const yearly = plans?.yearly?.product, monthly = plans?.monthly?.product
  const saving = yearly && monthly ? Math.round((1 - yearly.price / (monthly.price * 12)) * 100) : 0
  const storeName = t(`plus.store.${platform === 'ios' ? 'app_store' : 'play_store'}`)

  return (
    <div className="page plus-page">
      <div className="detail-bar">
        <span />
        <button type="button" className="btn-icon" onClick={() => navigate(-1)} aria-label={t('edit.close')}><CloseIcon size={20} /></button>
      </div>

      <div className="plus-hero">
        <span className="plus-mark" aria-hidden="true"><LeafIcon size={30} /></span>
        <p className="eyebrow">WasteLess Plus</p>
        <h1 className="headline">{t('plus.title')}</h1>
        <p className="page-subtitle">{t('plus.subtitle')}</p>
      </div>

      <ul className="plus-features">
        {FEATURES.map((f) => (
          <li key={f}>
            <span className="plus-check" aria-hidden="true"><CheckIcon size={16} /></span>
            <span>
              <span className="plus-feature-title">{t(`plus.feature.${f}`)}</span>
              {f === 'unlimited' && <span className="plus-feature-note">{t('plus.freeLimits', { items: user?.limits?.items ?? 30, members: user?.limits?.members ?? 2 })}</span>}
            </span>
          </li>
        ))}
      </ul>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {note && <div className="alert alert-success" role="status">{note}</div>}

      {plus.active ? (
        <Status plus={plus} onSynced={() => sync().catch(() => {})} />
      ) : !isNative ? (
        <section className="card" aria-labelledby="get-app">
          <h2 className="card-title" id="get-app">{t('plus.getApp')}</h2>
          <p className="card-note">{t('plus.getAppDesc')}</p>
          {(STORE_LINKS.ios || STORE_LINKS.android) && (
            <div className="action-row">
              {STORE_LINKS.ios && <a className="btn btn-primary btn-sm" href={STORE_LINKS.ios}>{t('plus.store.app_store')}</a>}
              {STORE_LINKS.android && <a className="btn btn-primary btn-sm" href={STORE_LINKS.android}>{t('plus.store.play_store')}</a>}
            </div>
          )}
        </section>
      ) : !purchasesAvailable ? (
        <div className="alert alert-warning" role="alert">{t('plus.storeUnavailable')}</div>
      ) : loading ? (
        <div className="loading" role="status">{t('common.loading')}</div>
      ) : plans && (plans.yearly || plans.monthly) ? (
        <>
          <div className="plan-list" role="radiogroup" aria-label={t('plus.choosePlan')}>
            {['yearly', 'monthly'].filter((key) => plans[key]).map((key) => {
              const product = plans[key].product
              return (
                <button key={key} type="button" role="radio" aria-checked={plan === key}
                  className={`plan-option${plan === key ? ' active' : ''}`} onClick={() => setPlan(key)}>
                  <span className="plan-radio" aria-hidden="true" />
                  <span className="plan-text">
                    <span className="plan-name">{t(`plus.${key}`)}</span>
                    <span className="plan-price">
                      {t(key === 'yearly' ? 'plus.perYear' : 'plus.perMonth', { price: product.priceString })}
                      {key === 'yearly' && product.pricePerMonthString && ` · ${t('plus.perMonth', { price: product.pricePerMonthString })}`}
                    </span>
                  </span>
                  {key === 'yearly' && saving > 0 && <span className="plan-badge">{t('plus.save', { pct: saving })}</span>}
                </button>
              )
            })}
          </div>

          <div className="plus-cta">
            <button type="button" className="btn btn-primary btn-full" onClick={purchase} disabled={busy}>
              {busy ? t('plus.working') : trial ? t('plus.startTrialFor', { trial }) : t('plus.subscribe')}
            </button>
            <p className="form-hint">
              {trial
                ? t(plan === 'yearly' ? 'plus.trialTermsYear' : 'plus.trialTermsMonth', { trial, price: selected.priceString })
                : t(plan === 'yearly' ? 'plus.termsYear' : 'plus.termsMonth', { price: selected.priceString })}
              {' '}{t('plus.autoRenew', { store: storeName })}
            </p>
          </div>
        </>
      ) : (
        <div className="alert alert-warning" role="alert">{t('plus.storeUnavailable')}</div>
      )}

      {isNative && purchasesAvailable && (
        <button type="button" className="text-link plus-restore" onClick={restorePurchases} disabled={busy}>{t('plus.restore')}</button>
      )}
      <Legal />
    </div>
  )
}
