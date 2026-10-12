import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ItemRow from '../components/ItemRow'
import EmptyPantry from '../components/EmptyPantry'
import { AlertIcon, LeafIcon, CartIcon, ChevronIcon } from '../components/Icons'
import { syncReminders } from '../lib/reminders'
import { daysUntil, expiryLabel, finishItem, formatDate, openedLabel } from '../lib/items'

const MS_PER_DAY = 86400000

export default function Today() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0) // 0 = today … 6
  const [busy, setBusy] = useState(false)
  const remindDays = user?.notifyDaysBefore ?? 2

  useEffect(() => {
    api.get('/items').then(({ data }) => {
      setItems(data)
      syncReminders(data, remindDays, t)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading" role="status">{t('dashboard.loading')}</div>
  if (items.length === 0) return <EmptyPantry itemCount={0} />

  const withDays = items.map((i) => ({ ...i, days: daysUntil(i.expiryDate) })).sort((a, b) => a.days - b.days)
  const expired = withDays.filter((i) => i.days < 0)
  const upcoming = withDays.filter((i) => i.days >= 0)
  const dueToday = upcoming.filter((i) => i.days === 0).length
  const hero = upcoming[0] || expired[0]
  const soon = upcoming.filter((i) => i !== hero && i.days <= 7).slice(0, 5)

  const week = Array.from({ length: 7 }, (_, n) => {
    const date = new Date(Date.now() + n * MS_PER_DAY)
    return { n, date, items: upcoming.filter((i) => i.days === n) }
  })
  const day = week[selectedDay]
  const dayName = (d) => formatDate(d.date, i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })

  const markUsed = async () => {
    setBusy(true)
    try {
      await finishItem(hero, 'consumed')
      setItems((prev) => prev.filter((i) => i._id !== hero._id))
    } finally { setBusy(false) }
  }

  return (
    <div className="page today">
      <div className="page-header">
        <p className="eyebrow">{formatDate(new Date(), i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="headline">{dueToday > 0 ? t('today.headline', { count: dueToday }) : t('today.headlineNone')}</h1>
      </div>

      {expired.length > 0 && (
        <Link to="/pantry" className="alert alert-error alert-link alert-icon"><AlertIcon size={20} /><span>{t('dashboard.expired', { count: expired.length })}</span></Link>
      )}

      {hero && (
        <section className="hero-card" aria-labelledby="hero-name">
          <div className="hero-top">
            <span className="hero-eyebrow">{t('today.useFirst')}</span>
            <span className="hero-pill">{expiryLabel(t, hero.days)}</span>
          </div>
          <div className="hero-row">
          <span className="hero-tile" aria-hidden="true"><LeafIcon size={34} /></span>
          <div className="hero-body">
            <Link to={`/item/${hero._id}`} id="hero-name" className="hero-name">{hero.name}</Link>
            <span className="hero-meta">
              {t(`location.${hero.location || 'fridge'}`)} · {hero.quantity} {hero.unit}
              {hero.openedAt && ` · ${openedLabel(t, hero.openedAt)}`}
            </span>
          </div>
          </div>
          <div className="hero-actions">
            <Link to={`/recipes?item=${encodeURIComponent(hero.name)}`} className="btn btn-hero">{t('today.findRecipe')}</Link>
            <button type="button" className="btn btn-hero-outline" onClick={markUsed} disabled={busy}>{t('today.markUsed')}</button>
          </div>
        </section>
      )}

      <section aria-labelledby="week-title">
        <h2 className="section-heading" id="week-title">{t('today.thisWeek')}</h2>
        <ol className="week-strip">
          {week.map((d) => (
            <li key={d.n}>
              <button
                type="button"
                className={`week-day${d.n === 0 ? ' is-today' : ''}${d.n === selectedDay ? ' is-selected' : ''}${d.items.length === 0 ? ' is-empty' : ''}`}
                aria-pressed={d.n === selectedDay}
                aria-controls="day-items"
                aria-label={t('today.dayCount', { day: formatDate(d.date, i18n.language, { weekday: 'long', day: 'numeric' }), count: d.items.length })}
                onClick={() => setSelectedDay(d.n)}
              >
                <span className="week-name" aria-hidden="true">{formatDate(d.date, i18n.language, { weekday: 'short' })}</span>
                <span className="week-date" aria-hidden="true">{d.date.getDate()}</span>
                <span className="week-count" aria-hidden="true">{d.items.length || '–'}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="day-items item-list" id="day-items" aria-live="polite">
          <h3 className="day-items-title">
            {selectedDay === 0 ? t('today.expiresToday') : selectedDay === 1 ? t('today.expiresTomorrow') : t('today.expiresOn', { day: dayName(day) })}
          </h3>
          {day.items.length === 0
            ? <p className="day-items-empty">{t('today.nothingThatDay')}</p>
            : day.items.map((item) => <ItemRow key={item._id} item={item} showBar={false} />)}
        </div>
      </section>

      {soon.length > 0 && (
        <section className="item-list" aria-labelledby="soon-title">
          <div className="section-row">
            <h2 className="section-heading" id="soon-title">{t('today.expiringSoon')}</h2>
            <Link to="/pantry" className="text-link">{t('today.seeAll')}</Link>
          </div>
          {soon.map((item) => <ItemRow key={item._id} item={item} showBar={false} />)}
        </section>
      )}

      <Link to="/shopping" className="link-card link-card--icon">
        <CartIcon className="link-card-icon" />
        <span className="link-card-text">
          <span className="link-card-title">{t('shopping.title')}</span>
          <span className="link-card-desc">{t('today.shoppingDesc')}</span>
        </span>
        <ChevronIcon size={20} className="link-card-chevron" />
      </Link>
    </div>
  )
}
