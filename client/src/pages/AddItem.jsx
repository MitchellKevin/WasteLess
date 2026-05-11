import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BarcodeScanner from '../components/BarcodeScanner'

const EMPTY_FORM = {
  name: '', barcode: '', category: '', quantity: 1,
  unit: 'item', expiryDate: '', imageUrl: '', price: '',
}

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

export default function AddItem() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [scanning, setScanning] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [cacheHit, setCacheHit] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleScan = useCallback(async (code) => {
    setScanning(false)
    setLookingUp(true)
    setCacheHit(false)
    setForm((f) => ({ ...f, barcode: code }))
    const info = await lookupBarcode(code)
    if (info) {
      setCacheHit(true)
      setForm((f) => ({ ...f, barcode: code, name: info.name || f.name, category: info.category || f.category, imageUrl: info.imageUrl || f.imageUrl }))
    }
    setLookingUp(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/items', { ...form, price: Number(form.price) || 0 })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="add-page">
      <h2>Add Item</h2>
      <div className="scan-section">
        {!scanning ? (
          <button className="btn btn-secondary" onClick={() => setScanning(true)}>📷 Scan Barcode</button>
        ) : (
          <div>
            <BarcodeScanner onScan={handleScan} />
            <button className="btn btn-ghost btn-sm" onClick={() => setScanning(false)}>Cancel scan</button>
          </div>
        )}
        {lookingUp && <p className="lookup-status">Looking up product…</p>}
        {cacheHit && !lookingUp && form.name && <p className="lookup-status lookup-cached">⚡ Loaded from cache</p>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={form.name} onChange={set('name')} required placeholder="e.g. Whole milk" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={form.category} onChange={set('category')} placeholder="e.g. Dairy" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Expiry date *</label>
            <input type="date" value={form.expiryDate} onChange={set('expiryDate')} required />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" value={form.quantity} onChange={set('quantity')} min="0" />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input type="text" value={form.unit} onChange={set('unit')} placeholder="item, L, kg…" />
          </div>
          <div className="form-group">
            <label>Price (€)</label>
            <input type="number" value={form.price} onChange={set('price')} min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>
        {form.barcode && (
          <div className="form-group">
            <label>Barcode</label>
            <input type="text" value={form.barcode} onChange={set('barcode')} />
          </div>
        )}
        {form.imageUrl && (
          <div className="product-preview"><img src={form.imageUrl} alt="Product" /></div>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save item'}</button>
        </div>
      </form>
    </div>
  )
}
