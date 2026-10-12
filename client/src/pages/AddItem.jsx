import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { lookupBarcode } from '../api/lookup'
import BarcodeScanner from '../components/BarcodeScanner'
import AddTabs from '../components/AddTabs'
import { LOCATIONS, formatDate, productKey, groupProducts, expiryLabel, daysUntil } from '../lib/items'
import { BarcodeIcon } from '../components/Icons'
import { PlusCard } from '../components/PlusGate'
import { useAuth } from '../context/AuthContext'
import { isPlus } from '../lib/plan'
import { inDays, useExpirySuggestion, suggestionReason } from '../lib/suggest'

const EMPTY = { name: '', barcode: '', category: '', quantity: 1, unit: 'item', expiryDate: '', imageUrl: '', price: '', notes: '', nutrients: null, location: 'fridge' }
const QUICK_DAYS = [3, 7, 14]

export default function AddItem() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // "Add another batch" from an item's page passes the product details along
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    expiryDate: inDays(7),
    name: params.get('name') || '',
    unit: params.get('unit') || EMPTY.unit,
    category: params.get('category') || '',
    location: LOCATIONS.includes(params.get('location')) ? params.get('location') : EMPTY.location,
  }))
  const [products, setProducts] = useState([])
  useEffect(() => { api.get('/items').then(({ data }) => setProducts(groupProducts(data))).catch(() => {}) }, [])
  const existing = form.name.trim() ? products.find((g) => g.key === productKey(form.name)) : null
  const [scanning, setScanning] = useState(params.get('scan') === '1')
  const [pickDate, setPickDate] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [cacheHit, setCacheHit] = useState(false)
  const [error, setError] = useState('')
  const [limitReached, setLimitReached] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const plus = isPlus(user)
  // Smart expiry dates (Plus) fill in the date and place until the user picks them themselves
  const [dateTouched, setDateTouched] = useState(false)
  const [locationTouched, setLocationTouched] = useState(Boolean(params.get('location')))
  const suggestion = useExpirySuggestion({ name: form.name, category: form.category, location: locationTouched ? form.location : undefined, enabled: plus })
  useEffect(() => {
    if (!suggestion) return
    setForm((f) => ({
      ...f,
      ...(dateTouched ? {} : { expiryDate: inDays(suggestion.days) }),
      ...(locationTouched ? {} : { location: suggestion.location }),
    }))
    if (!dateTouched) setPickDate(false)
  }, [suggestion])
  const applySuggestion = () => {
    setDateTouched(false); setPickDate(false)
    setForm((f) => ({ ...f, expiryDate: inDays(suggestion.days) }))
  }

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleScan = useCallback(async (code) => {
    setScanning(false); setLookingUp(true); setCacheHit(false)
    setForm((f) => ({ ...f, barcode: code }))
    const info = await lookupBarcode(code)
    if (info) {
      setCacheHit(true)
      setForm((f) => ({ ...f, barcode: code, name: info.name || f.name, category: info.category || f.category, imageUrl: info.imageUrl || f.imageUrl, nutrients: info.nutrients || null }))
    }
    setLookingUp(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!form.expiryDate) { setError(t('add.expiryRequired')); return }
    setSaving(true)
    try {
      // A new batch of something you already have keeps that product's spelling
      const dateSource = dateTouched ? 'manual' : suggestion ? 'suggested' : 'default'
      await api.post('/items', { ...form, name: existing ? existing.name : form.name.trim(), price: Number(form.price) || 0, dateSource })
      navigate('/')
    } catch (err) {
      if (err.response?.data?.code === 'limit_items') setLimitReached(err.response.data.limit)
      else setError(err.response?.data?.message || t('common.error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="add-page">
      <AddTabs />
      <h2>{t('add.title')}</h2>
      <div className="scan-section">
        {!scanning ? (
          <button type="button" className="btn btn-secondary" onClick={() => setScanning(true)}><BarcodeIcon size={20} />{t('add.scan')}</button>
        ) : (
          <>
            <BarcodeScanner onScan={handleScan} onCancel={() => setScanning(false)} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setScanning(false)}>{t('add.cancelScan')}</button>
          </>
        )}
        <div aria-live="polite">
          {lookingUp && <p className="lookup-status">{t('add.lookingUp')}</p>}
          {cacheHit && !lookingUp && form.name && <p className="lookup-status lookup-cached">{t('add.cached')}</p>}
        </div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {limitReached && <PlusCard title={t('plus.gate.itemsTitle', { count: limitReached })} desc={t('plus.gate.itemsDesc')} />}
      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="add-name">{t('add.name')} *</label>
            <input id="add-name" type="text" value={form.name} onChange={set('name')} required placeholder={t('add.namePlaceholder')} />
            {existing && (
              <span className="form-hint batch-hint" role="status">
                {t('batches.existing', { count: existing.batches.length, when: expiryLabel(t, daysUntil(existing.batches[0].expiryDate)).toLowerCase() })}
              </span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="add-category">{t('add.category')}</label>
            <input id="add-category" type="text" value={form.category} onChange={set('category')} placeholder={t('add.categoryPlaceholder')} />
          </div>
        </div>
        <fieldset className="form-group">
          <legend className="form-legend">{t('add.expiry')} *</legend>
          <div className="chip-row">
            {QUICK_DAYS.map((n) => (
              <button key={n} type="button" className={`chip${!pickDate && form.expiryDate === inDays(n) ? ' active' : ''}`}
                aria-pressed={!pickDate && form.expiryDate === inDays(n)}
                onClick={() => { setPickDate(false); setDateTouched(true); setForm((f) => ({ ...f, expiryDate: inDays(n) })) }}>
                {n % 7 === 0 ? t('add.quickWeeks', { count: n / 7 }) : t('add.quickDays', { count: n })}
              </button>
            ))}
            <button type="button" className={`chip${pickDate ? ' active' : ''}`} aria-pressed={pickDate} onClick={() => { setPickDate(true); setDateTouched(true) }}>
              {t('add.pickDate')}
            </button>
          </div>
          {pickDate ? (
            <input id="add-expiry" type="date" aria-label={t('add.expiry')} value={form.expiryDate} onChange={(e) => { setDateTouched(true); set('expiryDate')(e) }} required />
          ) : (
            form.expiryDate && <span className="form-hint">{formatDate(form.expiryDate, i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          )}
          {plus && suggestion && !dateTouched && (
            <span className="smart-hint" role="status"><span className="plus-badge">Plus</span>{t('smart.suggested', { reason: suggestionReason(t, suggestion) })}</span>
          )}
          {plus && suggestion && dateTouched && form.expiryDate !== inDays(suggestion.days) && (
            <span className="smart-hint">
              <span className="plus-badge">Plus</span>{t('smart.wouldSuggest', { date: formatDate(inDays(suggestion.days), i18n.language) })}
              <button type="button" className="text-link" onClick={applySuggestion}>{t('smart.use')}</button>
            </span>
          )}
          {!plus && form.name.trim().length >= 2 && (
            <span className="smart-hint smart-hint--teaser"><span className="plus-badge">Plus</span><Link to="/plus" className="text-link">{t('smart.teaser')}</Link></span>
          )}
        </fieldset>
        <fieldset className="form-group">
          <legend className="form-legend">{t('detail.storedIn')}</legend>
          <div className="chip-row" role="radiogroup" aria-label={t('detail.storedIn')}>
            {LOCATIONS.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={form.location === l}
                className={`chip${form.location === l ? ' active' : ''}`}
                onClick={() => { setLocationTouched(true); setForm((f) => ({ ...f, location: l })) }}>
                {t(`location.${l}`)}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="add-qty">{t('add.quantity')}</label>
            <input id="add-qty" type="number" inputMode="decimal" value={form.quantity} onChange={set('quantity')} min="0" step="any" />
          </div>
          <div className="form-group">
            <label htmlFor="add-unit">{t('add.unit')}</label>
            <input id="add-unit" type="text" value={form.unit} onChange={set('unit')} placeholder={t('add.unitPlaceholder')} />
          </div>
          <div className="form-group">
            <label htmlFor="add-price">{t('add.price')}</label>
            <input id="add-price" type="number" inputMode="decimal" value={form.price} onChange={set('price')} min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>
        {form.barcode && (
          <div className="form-group">
            <label htmlFor="add-barcode">{t('add.barcode')}</label>
            <input id="add-barcode" type="text" inputMode="numeric" value={form.barcode} onChange={set('barcode')} />
          </div>
        )}
        {form.imageUrl && <div className="product-preview"><img src={form.imageUrl} alt={form.name || t('add.title')} /></div>}
        <div className="form-group">
          <label htmlFor="add-notes">{t('add.notes')}</label>
          <textarea id="add-notes" value={form.notes} onChange={set('notes')} placeholder={t('add.notesPlaceholder')} rows={2} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>{t('add.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('add.saving') : t('add.save')}</button>
        </div>
      </form>
    </div>
  )
}
