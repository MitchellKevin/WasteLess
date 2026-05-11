import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { lookupBarcode } from '../api/lookup'
import BarcodeScanner from '../components/BarcodeScanner'

const EMPTY = { name: '', barcode: '', category: '', quantity: 1, unit: 'item', expiryDate: '', imageUrl: '', price: '', notes: '', nutrients: null }

export default function AddItem() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [scanning, setScanning] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [cacheHit, setCacheHit] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await api.post('/items', { ...form, price: Number(form.price) || 0 })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally { setSaving(false) }
  }

  return (
    <div className="add-page">
      <h2>{t('add.title')}</h2>
      <div className="scan-section">
        {!scanning ? (
          <button className="btn btn-secondary" onClick={() => setScanning(true)}>{t('add.scan')}</button>
        ) : (
          <div>
            <BarcodeScanner onScan={handleScan} />
            <button className="btn btn-ghost btn-sm" onClick={() => setScanning(false)}>{t('add.cancelScan')}</button>
          </div>
        )}
        {lookingUp && <p className="lookup-status">{t('add.lookingUp')}</p>}
        {cacheHit && !lookingUp && form.name && <p className="lookup-status lookup-cached">{t('add.cached')}</p>}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-row">
          <div className="form-group">
            <label>{t('add.name')} *</label>
            <input type="text" value={form.name} onChange={set('name')} required placeholder={t('add.namePlaceholder')} />
          </div>
          <div className="form-group">
            <label>{t('add.category')}</label>
            <input type="text" value={form.category} onChange={set('category')} placeholder={t('add.categoryPlaceholder')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{t('add.expiry')} *</label>
            <input type="date" value={form.expiryDate} onChange={set('expiryDate')} required />
          </div>
          <div className="form-group">
            <label>{t('add.quantity')}</label>
            <input type="number" value={form.quantity} onChange={set('quantity')} min="0" />
          </div>
          <div className="form-group">
            <label>{t('add.unit')}</label>
            <input type="text" value={form.unit} onChange={set('unit')} placeholder={t('add.unitPlaceholder')} />
          </div>
          <div className="form-group">
            <label>{t('add.price')}</label>
            <input type="number" value={form.price} onChange={set('price')} min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>
        {form.barcode && (
          <div className="form-group">
            <label>{t('add.barcode')}</label>
            <input type="text" value={form.barcode} onChange={set('barcode')} />
          </div>
        )}
        {form.imageUrl && <div className="product-preview"><img src={form.imageUrl} alt="Product" /></div>}
        <div className="form-group">
          <label>{t('add.notes')}</label>
          <textarea value={form.notes} onChange={set('notes')} placeholder={t('add.notesPlaceholder')} rows={2} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>{t('add.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('add.saving') : t('add.save')}</button>
        </div>
      </form>
    </div>
  )
}
