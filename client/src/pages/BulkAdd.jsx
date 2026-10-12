import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BarcodeScanner from '../components/BarcodeScanner'
import AddTabs from '../components/AddTabs'
import { PlusCard } from '../components/PlusGate'
import { useAuth } from '../context/AuthContext'
import { isPlus } from '../lib/plan'
import { fetchSuggestions, inDays, suggestionReason } from '../lib/suggest'
import { LOCATIONS } from '../lib/items'
import { CloseIcon, BarcodeIcon } from '../components/Icons'
import { useTranslation } from 'react-i18next'

async function lookupBarcode(barcode) {
  try {
    const { data } = await api.get(`/barcodes/${barcode}`)
    if (data.name) return data
  } catch {}
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product
    const info = {
      barcode,
      name: p.product_name || p.product_name_en || '',
      category: p.categories_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') || '',
      imageUrl: p.image_front_small_url || p.image_url || '',
    }
    if (info.name) api.post('/barcodes', info).catch(() => {})
    return info
  } catch {
    return null
  }
}

const emptyItem = (info = {}) => ({
  name: info.name || '',
  barcode: info.barcode || '',
  category: info.category || '',
  imageUrl: info.imageUrl || '',
  quantity: 1,
  unit: 'item',
  expiryDate: '',
  price: '',
  location: 'fridge',
  dateSource: 'default',
  suggestion: null,
})

// Fill in date and storage place with smart expiry dates (bulk add is Plus-only)
async function withSuggestion(item) {
  if (!item.name) return item
  const [s] = await fetchSuggestions([{ name: item.name, category: item.category }])
  return s ? { ...item, expiryDate: inDays(s.days), location: s.location, dateSource: 'suggested', suggestion: s } : item
}

export default function BulkAdd() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [current, setCurrent] = useState(null)
  const [scanning, setScanning] = useState(true)
  const [lookingUp, setLookingUp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleScan = useCallback(async (code) => {
    setScanning(false)
    setLookingUp(true)
    const info = await lookupBarcode(code)
    setCurrent(await withSuggestion(emptyItem({ ...info, barcode: code })))
    setLookingUp(false)
  }, [])

  const setField = (k) => (e) =>
    setCurrent((c) => ({ ...c, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const addToQueue = (e) => {
    e.preventDefault()
    setPending((p) => [...p, current])
    setCurrent(null)
    setScanning(true)
  }

  const removeFromQueue = (i) => setPending((p) => p.filter((_, idx) => idx !== i))

  const saveAll = async () => {
    setSaving(true)
    setError('')
    try {
      await Promise.all(pending.map(({ suggestion, ...item }) => api.post('/items', { ...item, price: Number(item.price) || 0 })))
      navigate('/')
    } catch {
      setError(t('bulk.error'))
      setSaving(false)
    }
  }

  if (!isPlus(user)) {
    return (
      <div className="add-page">
        <AddTabs />
        <PlusCard title={t('plus.gate.bulkTitle')} desc={t('plus.gate.bulkDesc')} />
      </div>
    )
  }

  return (
    <div className="add-page">
      <AddTabs />
      <div className="bulk-header">
        <h2>{t('bulk.title')}</h2>
        {pending.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={saveAll} disabled={saving}>
            {saving ? t('bulk.saving') : t('bulk.saveAll', { count: pending.length })}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {scanning && !current && (
        <div className="scan-section">
          {lookingUp ? (
            <p className="lookup-status" aria-live="polite">{t('add.lookingUp')}</p>
          ) : (
            <>
              <BarcodeScanner onScan={handleScan} onCancel={() => setScanning(false)} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCurrent(emptyItem())}>
                {t('bulk.addManually')}
              </button>
            </>
          )}
        </div>
      )}

      {!scanning && !current && (
        <div className="scan-section">
          <button type="button" className="btn btn-secondary" onClick={() => setScanning(true)}><BarcodeIcon size={20} />{t('add.scan')}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCurrent(emptyItem())}>{t('bulk.addManually')}</button>
        </div>
      )}

      {current && (
        <form onSubmit={addToQueue} className="item-form bulk-form">
          {current.imageUrl && (
            <div className="product-preview">
              <img src={current.imageUrl} alt={current.name} />
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bulk-name">{t('add.name')} *</label>
              <input id="bulk-name" type="text" value={current.name} onChange={setField('name')} required placeholder={t('bulk.namePlaceholder')}
                onBlur={async () => { if (current.dateSource === 'default' && current.name.trim().length >= 2) { const next = await withSuggestion(current); setCurrent((c) => (c && c.dateSource === 'default' ? { ...c, ...next, name: c.name } : c)) } }} />
            </div>
            <div className="form-group">
              <label htmlFor="bulk-category">{t('add.category')}</label>
              <input id="bulk-category" type="text" value={current.category} onChange={setField('category')} placeholder={t('add.categoryPlaceholder')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bulk-expiry">{t('add.expiry')} *</label>
              <input id="bulk-expiry" type="date" value={current.expiryDate} required
                onChange={(e) => setCurrent((c) => ({ ...c, expiryDate: e.target.value, dateSource: 'manual' }))} />
              {current.suggestion && current.dateSource === 'suggested' && (
                <span className="smart-hint"><span className="plus-badge">Plus</span>{t('smart.suggested', { reason: suggestionReason(t, current.suggestion) })}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="bulk-location">{t('detail.storedIn')}</label>
              <select id="bulk-location" value={current.location} onChange={setField('location')}>
                {LOCATIONS.map((l) => <option key={l} value={l}>{t(`location.${l}`)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="bulk-qty">{t('bulk.qty')}</label>
              <input id="bulk-qty" type="number" inputMode="decimal" value={current.quantity} onChange={setField('quantity')} min="0" step="any" />
            </div>
            <div className="form-group">
              <label htmlFor="bulk-unit">{t('add.unit')}</label>
              <input id="bulk-unit" type="text" value={current.unit} onChange={setField('unit')} placeholder={t('add.unitPlaceholder')} />
            </div>
            <div className="form-group">
              <label htmlFor="bulk-price">{t('add.price')}</label>
              <input id="bulk-price" type="number" inputMode="decimal" value={current.price} onChange={setField('price')} min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => { setCurrent(null); setScanning(true) }}>
              {t('bulk.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">{t('bulk.addNext')}</button>
          </div>
        </form>
      )}

      {pending.length > 0 && (
        <section className="pending-list" aria-labelledby="bulk-queue">
          <h3 className="section-title" id="bulk-queue">{t('bulk.queue', { count: pending.length })}</h3>
          {pending.map((item, i) => (
            <div key={i} className="pending-item">
              <div className="pending-info">
                <span className="pending-name">{item.name || t('bulk.unnamed')}</span>
                <span className="pending-meta">
                  {item.expiryDate} · {item.quantity} {item.unit}
                  {item.price ? ` · €${Number(item.price).toFixed(2)}` : ''}
                </span>
              </div>
              <button
                type="button"
                className="btn-icon btn-icon--danger"
                onClick={() => removeFromQueue(i)}
                aria-label={t('bulk.remove', { name: item.name || t('bulk.unnamed') })}
              >
                <CloseIcon size={18} />
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
