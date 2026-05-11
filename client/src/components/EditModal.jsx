import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

export default function EditModal({ item, onSave, onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: item.name, category: item.category || '',
    quantity: item.quantity, unit: item.unit, expiryDate: item.expiryDate.slice(0, 10),
    notes: item.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await api.patch(`/items/${item._id}`, form)
      onSave(data); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('edit.title')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('edit.name')}</label>
            <input type="text" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label>{t('edit.category')}</label>
            <input type="text" value={form.category} onChange={set('category')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('edit.expiry')}</label>
              <input type="date" value={form.expiryDate} onChange={set('expiryDate')} required />
            </div>
            <div className="form-group">
              <label>{t('edit.quantity')}</label>
              <input type="number" value={form.quantity} onChange={set('quantity')} min="0" />
            </div>
            <div className="form-group">
              <label>{t('edit.unit')}</label>
              <input type="text" value={form.unit} onChange={set('unit')} />
            </div>
          </div>
          <div className="form-group">
            <label>{t('edit.notes')}</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t('edit.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('edit.saving') : t('edit.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
