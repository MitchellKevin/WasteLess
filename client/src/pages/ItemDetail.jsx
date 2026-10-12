import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import EditModal from '../components/EditModal'
import NutritionPanel from '../components/NutritionPanel'
import { BackIcon, PencilIcon, MinusIcon, PlusIcon, CheckIcon, SnowflakeIcon, TrashIcon, RecipesIcon, ChevronIcon } from '../components/Icons'
import { LOCATIONS, daysUntil, urgency, expiryLabel, freshness, formatDate, finishItem, freezeItem, openedLabel, remindLabel } from '../lib/items'

export default function ItemDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/items').then(({ data }) => setItem(data.find((i) => i._id === id) || null)).finally(() => setLoading(false))
  }, [id])

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

  const run = async (fn, after) => {
    setBusy(true); setError('')
    try { await after(await fn()) }
    catch (err) { setError(err.response?.data?.message || t('common.error')) }
    finally { setBusy(false) }
  }
  const patch = (changes) => run(() => api.patch(`/items/${item._id}`, changes), ({ data }) => setItem(data))
  const finish = (action) => run(() => finishItem(item, action), () => navigate('/pantry'))
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
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => patch({ openedAt: new Date().toISOString() })} disabled={busy}>
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
