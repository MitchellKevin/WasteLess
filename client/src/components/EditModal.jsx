import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import useDialog from '../hooks/useDialog'
import { LOCATIONS } from '../lib/items'
import { CloseIcon } from './Icons'

export default function EditModal({ item, onSave, onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: item.name, category: item.category || '',
    quantity: item.quantity, unit: item.unit, expiryDate: item.expiryDate.slice(0, 10),
    notes: item.notes || '',
    location: item.location || 'fridge',
  })
  const [saving, setSaving] = useState(false)
  const id = useId()
  const dialogRef = useDialog(onClose)

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
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={`${id}-title`}>{t('edit.title')}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label={t('edit.close')}><CloseIcon size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor={`${id}-name`}>{t('edit.name')}</label>
            <input id={`${id}-name`} type="text" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label htmlFor={`${id}-category`}>{t('edit.category')}</label>
            <input id={`${id}-category`} type="text" value={form.category} onChange={set('category')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`${id}-expiry`}>{t('edit.expiry')}</label>
              <input id={`${id}-expiry`} type="date" value={form.expiryDate} onChange={set('expiryDate')} required />
            </div>
            <div className="form-group">
              <label htmlFor={`${id}-qty`}>{t('edit.quantity')}</label>
              <input id={`${id}-qty`} type="number" inputMode="decimal" value={form.quantity} onChange={set('quantity')} min="0" step="any" />
            </div>
            <div className="form-group">
              <label htmlFor={`${id}-unit`}>{t('edit.unit')}</label>
              <input id={`${id}-unit`} type="text" value={form.unit} onChange={set('unit')} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor={`${id}-location`}>{t('detail.storedIn')}</label>
            <select id={`${id}-location`} value={form.location} onChange={set('location')}>
              {LOCATIONS.map((l) => <option key={l} value={l}>{t(`location.${l}`)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor={`${id}-notes`}>{t('edit.notes')}</label>
            <textarea id={`${id}-notes`} value={form.notes} onChange={set('notes')} rows={2} />
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
