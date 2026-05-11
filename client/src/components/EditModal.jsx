import { useState } from 'react'
import api from '../api/axios'

export default function EditModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item.name,
    category: item.category || '',
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiryDate.slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch(`/items/${item._id}`, form)
      onSave(data)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit item</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={form.category} onChange={set('category')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry date</label>
              <input type="date" value={form.expiryDate} onChange={set('expiryDate')} required />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" value={form.quantity} onChange={set('quantity')} min="0" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input type="text" value={form.unit} onChange={set('unit')} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
