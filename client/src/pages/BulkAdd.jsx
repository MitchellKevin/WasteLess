import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BarcodeScanner from '../components/BarcodeScanner'

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
})

export default function BulkAdd() {
  const navigate = useNavigate()
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
    setCurrent(emptyItem({ ...info, barcode: code }))
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
      await Promise.all(pending.map((item) => api.post('/items', { ...item, price: Number(item.price) || 0 })))
      navigate('/')
    } catch {
      setError('Some items failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="add-page">
      <div className="bulk-header">
        <h2>Bulk Add</h2>
        {pending.length > 0 && (
          <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
            {saving ? 'Saving…' : `Save all (${pending.length})`}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {scanning && !current && (
        <div className="scan-section">
          {lookingUp ? (
            <p className="lookup-status">Looking up product…</p>
          ) : (
            <>
              <BarcodeScanner onScan={handleScan} />
              <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(emptyItem())}>
                Add manually instead
              </button>
            </>
          )}
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
              <label>Name *</label>
              <input type="text" value={current.name} onChange={setField('name')} required placeholder="Product name" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input type="text" value={current.category} onChange={setField('category')} placeholder="e.g. Dairy" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry date *</label>
              <input type="date" value={current.expiryDate} onChange={setField('expiryDate')} required />
            </div>
            <div className="form-group">
              <label>Qty</label>
              <input type="number" value={current.quantity} onChange={setField('quantity')} min="0" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input type="text" value={current.unit} onChange={setField('unit')} placeholder="item, L…" />
            </div>
            <div className="form-group">
              <label>Price (€)</label>
              <input type="number" value={current.price} onChange={setField('price')} min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => { setCurrent(null); setScanning(true) }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">Add &amp; scan next</button>
          </div>
        </form>
      )}

      {pending.length > 0 && (
        <div className="pending-list">
          <p className="section-title">Queue ({pending.length})</p>
          {pending.map((item, i) => (
            <div key={i} className="pending-item">
              <div className="pending-info">
                <span className="pending-name">{item.name || 'Unnamed'}</span>
                <span className="pending-meta">
                  {item.expiryDate} · {item.quantity} {item.unit}
                  {item.price ? ` · €${Number(item.price).toFixed(2)}` : ''}
                </span>
              </div>
              <button className="btn-icon btn-icon--danger" onClick={() => removeFromQueue(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
