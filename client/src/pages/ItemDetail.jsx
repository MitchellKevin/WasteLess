import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import EditModal from '../components/EditModal'
import NutritionPanel from '../components/NutritionPanel'
import { BackIcon, PencilIcon, MinusIcon, PlusIcon, CheckIcon, SnowflakeIcon, TrashIcon, RecipesIcon, ChevronIcon } from '../components/Icons'
import { isPlus } from '../lib/plan'
import { fetchSuggestions, inDays } from '../lib/suggest'
import { LOCATIONS, daysUntil, urgency, expiryLabel, freshness, formatDate, finishItem, freezeItem, openedLabel, remindLabel, productKey, totalQuantity } from '../lib/items'

export default function ItemDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openedNote, setOpenedNote] = useState(null)

  useEffect(() => {
    api.get('/items').then(({ data }) => setItems(data)).finally(() => setLoading(false))
  }, [id])

  const item = items.find((i) => i._id === id) || null
  const setItem = (updated) => setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)))

  if (loading) return <div className="loading" role="status">{t('common.loading')}</div>
  if (!item) {
    return (
      <div className="empty-state">
        <p>{t('detail.notFound')}</p>
        <Link to="/pantry" className="btn btn-primary">{t('detail.toPantry')}</Link>
      </div>
    )
  }

  const days = daysUntil(item.expiryDate)
  const level = urgency(days)
  const fresh = freshness(item)
  const location = item.location || 'fridge'
  const addedBy = item.user?._id === user?.id ? t('detail.byYou') : item.user?.name
  // Other expiry dates of the same product
  const batches = items
    .filter((i) => productKey(i.name) === productKey(item.name))
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
  const addBatchUrl = `/add?${new URLSearchParams({ name: item.name, unit: item.unit || 'item', category: item.category || '', location })}`

  const run = async (fn, after) => {
    setBusy(true); setError('')
    try { await after(await fn()) }
    catch (err) { setError(err.response?.data?.message || t('common.error')) }
    finally { setBusy(false) }
  }
  const patch = (changes) => run(() => api.patch(`/items/${item._id}`, changes), ({ data }) => setItem(data))

  // Opened: with Plus the use-by date moves to how long it keeps once opened (if that's sooner)
  const markOpened = () => run(async () => {
    const changes = { openedAt: new Date().toISOString() }
    let note = null
    if (isPlus(user)) {
      const [s] = await fetchSuggestions([{ name: item.name, category: item.category, location, opened: true }])
      const date = s && inDays(s.days)
      if (date && date < item.expiryDate.slice(0, 10)) {
        changes.expiryDate = date
        note = { previous: item.expiryDate.slice(0, 10), days: s.days, date }
      }
    }
    const { data } = await api.patch(`/items/${item._id}`, changes)
    return { data, note }
  }, ({ data, note }) => { setItem(data); setOpenedNote(note) })
  const undoOpenedDate = () => run(() => api.patch(`/items/${item._id}`, { expiryDate: openedNote.previous }), ({ data }) => { setItem(data); setOpenedNote(null) })
  // Done with this batch: continue with the next one of the same product, if any
  const finish = (action) => run(() => finishItem(item, action), () => {
    const next = batches.find((b) => b._id !== item._id)
    if (next) { setItems((prev) => prev.filter((i) => i._id !== item._id)); navigate(`/item/${next._id}`, { replace: true }) }
    else navigate('/pantry')
  })
  const freeze = () => run(() => freezeItem(item), setItem)

  return (
    <div className="page detail">
      <div className="detail-bar">
        <button type="button" className="btn btn-ghost btn-sm btn-back" onClick={() => navigate(-1)}><BackIcon size={20} />{t('detail.back')}</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><PencilIcon size={18} />{t('detail.edit')}</button>
      </div>

      <div className="page-header">
        <h1 className="headline">{item.name}</h1>
        <span className={`pill pill--${level}`}>{expiryLabel(t, days)}</span>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {openedNote && (
        <div className="alert alert-success smart-note" role="status">
          <span><span className="plus-badge">Plus</span>{t('smart.openedMoved', { count: openedNote.days, date: formatDate(openedNote.date, i18n.language) })}</span>
          <button type="button" className="text-link" onClick={undoOpenedDate} disabled={busy}>{t('detail.undo')}</button>
        </div>
      )}

      <section className="card" aria-labelledby="fresh-title">
        <div className="card-head">
          <h2 className="card-label" id="fresh-title">{t('detail.freshness')}</h2>
          <span className={`card-figure when--${level}`}>{t('detail.left', { pct: fresh })}</span>
        </div>
        <span className="fresh-bar fresh-bar--lg" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fresh} aria-labelledby="fresh-title">
          <span className={`fresh-fill fill--${level}`} style={{ width: `${fresh}%` }} />
        </span>
        <p className="card-note">
          {t('detail.useBy', { date: formatDate(item.expiryDate, i18n.language) })}
          {item.openedAt && ` · ${openedLabel(t, item.openedAt)}`}
        </p>
      </section>

      <div className="action-row">
        <button type="button" className="btn btn-primary" onClick={() => finish('consumed')} disabled={busy}><CheckIcon size={20} />{t('detail.used')}</button>
        {location !== 'freezer' && (
          <button type="button" className="btn btn-secondary" onClick={freeze} disabled={busy}><SnowflakeIcon size={20} />{t('detail.freeze')}</button>
        )}
        <button type="button" className="btn btn-secondary btn-danger-text" onClick={() => finish('wasted')} disabled={busy}><TrashIcon size={20} />{t('detail.threwAway')}</button>
      </div>

      <section className="card batch-card" aria-labelledby="batches-title">
        <div className="card-head">
          <h2 className="card-label" id="batches-title">{t('batches.title')}</h2>
          {batches.length > 1 && <span className="card-meta">{totalQuantity(batches) ?? t('batches.count', { count: batches.length })}</span>}
        </div>
        {batches.length > 1 && (
          <ul className="batch-list">
            {batches.map((b) => {
              const d = daysUntil(b.expiryDate)
              const current = b._id === item._id
              return (
                <li key={b._id}>
                  <Link to={`/item/${b._id}`} replace className={`batch-row${current ? ' current' : ''}`} aria-current={current ? 'true' : undefined}>
                    <span className="batch-date">{formatDate(b.expiryDate, i18n.language)}</span>
                    <span className="item-row-meta">{b.quantity} {b.unit} · {t(`location.${b.location || 'fridge'}`)}</span>
                    <span className={`batch-when when--${urgency(d)}`}>{expiryLabel(t, d)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <Link to={addBatchUrl} className="btn btn-secondary btn-sm"><PlusIcon size={18} />{t('batches.add')}</Link>
      </section>

      <Link to={`/recipes?item=${encodeURIComponent(item.name)}`} className="link-card link-card--icon">
        <RecipesIcon className="link-card-icon" />
        <span className="link-card-text">
          <span className="link-card-title">{t('detail.recipes')}</span>
          <span className="link-card-desc">{t('detail.recipesDesc')}</span>
        </span>
        <ChevronIcon size={20} className="link-card-chevron" />
      </Link>

      <dl className="card detail-list">
        <div className="detail-row">
          <dt>{t('detail.storedIn')}</dt>
          <dd>
            <div className="chip-row" role="radiogroup" aria-label={t('detail.storedIn')}>
              {LOCATIONS.map((l) => (
                <button key={l} type="button" role="radio" aria-checked={location === l}
                  className={`chip chip--sm${location === l ? ' active' : ''}`}
                  onClick={() => location !== l && patch({ location: l })} disabled={busy}>
                  {t(`location.${l}`)}
                </button>
              ))}
            </div>
          </dd>
        </div>
        <div className="detail-row">
          <dt>{t('detail.quantity')}</dt>
          <dd className="qty-control">
            <button type="button" className="qty-btn" onClick={() => patch({ quantity: Math.max(0, item.quantity - 1) })}
              disabled={busy || item.quantity <= 0} aria-label={t('item.decrease', { name: item.name })}><MinusIcon size={18} /></button>
            <span className="qty-value" aria-live="polite">{item.quantity} {item.unit}</span>
            <button type="button" className="qty-btn" onClick={() => patch({ quantity: item.quantity + 1 })}
              disabled={busy} aria-label={t('item.increase', { name: item.name })}><PlusIcon size={18} /></button>
          </dd>
        </div>
        <div className="detail-row">
          <dt>{t('detail.opened')}</dt>
          <dd>
            {item.openedAt ? (
              <span className="detail-value">
                {formatDate(item.openedAt, i18n.language)}
                <button type="button" className="text-link" onClick={() => patch({ openedAt: null })} disabled={busy}>{t('detail.undo')}</button>
              </span>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={markOpened} disabled={busy}>
                {t('detail.markOpened')}
              </button>
            )}
          </dd>
        </div>
        <div className="detail-row">
          <dt>{t('detail.added')}</dt>
          <dd className="detail-value">{formatDate(item.createdAt, i18n.language)}{addedBy && `, ${addedBy}`}</dd>
        </div>
        <div className="detail-row">
          <dt>{t('detail.reminder')}</dt>
          <dd><Link to="/settings/notifications" className="text-link">{remindLabel(t, user?.notifyDaysBefore ?? 2)}</Link></dd>
        </div>
        {item.category && (
          <div className="detail-row">
            <dt>{t('add.category')}</dt>
            <dd className="detail-value detail-value--cap">{item.category}</dd>
          </div>
        )}
        {item.price > 0 && (
          <div className="detail-row">
            <dt>{t('add.price')}</dt>
            <dd className="detail-value">€{item.price.toFixed(2)}</dd>
          </div>
        )}
      </dl>

      {item.notes && <p className="card card-note">{item.notes}</p>}
      {item.nutrients?.calories > 0 && <NutritionPanel nutrients={item.nutrients} />}

      {editing && <EditModal item={item} onSave={setItem} onClose={() => setEditing(false)} />}
    </div>
  )
}
