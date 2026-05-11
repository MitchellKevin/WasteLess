import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import EditModal from './EditModal'
import NutritionPanel from './NutritionPanel'

const MS_PER_DAY = 86400000

function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr); exp.setHours(0, 0, 0, 0)
  return Math.round((exp - now) / MS_PER_DAY)
}

function urgencyClass(days) {
  if (days < 0) return 'expired'
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'warning'
  return 'ok'
}

export default function ItemCard({ item, onDelete, onQuantityChange, onEdit }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showNutrition, setShowNutrition] = useState(false)
  const days = daysUntil(item.expiryDate)
  const cls = urgencyClass(days)

  const expiryLabel = () => {
    if (days < 0) return t('item.expiredAgo', { count: Math.abs(days) })
    if (days === 0) return t('item.expiresToday')
    if (days === 1) return t('item.expiresTomorrow')
    return t('item.expiresIn', { count: days })
  }

  const handleDelete = async (action) => {
    await api.post('/logs', { itemName: item.name, action, quantity: item.quantity, unit: item.unit, price: item.price || 0, totalValue: (item.price || 0) * item.quantity })
    await api.delete(`/items/${item._id}`)
    onDelete(item._id)
  }

  const handleQty = async (delta) => {
    const newQty = item.quantity + delta
    if (newQty < 0) return
    const { data } = await api.patch(`/items/${item._id}`, { quantity: newQty })
    onQuantityChange(data)
  }

  return (
    <>
      <div className={`item-card item-card--${cls}`}>
        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="item-image" />}
        <div className="item-body">
          <div className="item-header">
            <span className="item-name">{item.name}</span>
            {item.category && <span className="item-category">{item.category}</span>}
          </div>
          <div className={`item-expiry expiry--${cls}`}>{expiryLabel()}</div>
          {item.price > 0 && <div className="item-price">€{item.price.toFixed(2)}</div>}
          {item.notes && <div className="item-notes">{item.notes}</div>}

          {item.nutrients?.calories > 0 && (
            <button className="nutrition-toggle" onClick={() => setShowNutrition((v) => !v)}>
              {showNutrition ? t('item.hideNutrition') : t('item.nutrition')}
            </button>
          )}
          {showNutrition && <NutritionPanel nutrients={item.nutrients} />}

          {confirming ? (
            <div className="delete-confirm">
              <p className="delete-prompt-text">{t('item.usedUp')}</p>
              <div className="delete-actions">
                <button className="btn-action btn-consumed" onClick={() => handleDelete('consumed')}>{t('item.consumed')}</button>
                <button className="btn-action btn-wasted" onClick={() => handleDelete('wasted')}>{t('item.wasted')}</button>
                <button className="btn-action btn-cancel" onClick={() => setConfirming(false)}>{t('item.keep')}</button>
              </div>
            </div>
          ) : (
            <div className="item-footer">
              <div className="qty-control">
                <button onClick={() => handleQty(-1)} className="qty-btn">−</button>
                <span className="qty-value">{item.quantity} {item.unit}</span>
                <button onClick={() => handleQty(1)} className="qty-btn">+</button>
              </div>
              <div className="item-actions">
                <button onClick={() => setEditing(true)} className="btn-icon" title={t('edit.title')}>✎</button>
                <button onClick={() => setConfirming(true)} className="btn-icon btn-icon--danger">✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {editing && <EditModal item={item} onSave={onEdit} onClose={() => setEditing(false)} />}
    </>
  )
}
