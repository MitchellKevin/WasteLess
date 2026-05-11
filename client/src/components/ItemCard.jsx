import { useState } from 'react'
import api from '../api/axios'
import EditModal from './EditModal'

const MS_PER_DAY = 86400000

function daysUntil(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.round((exp - now) / MS_PER_DAY)
}

function urgencyClass(days) {
  if (days < 0) return 'expired'
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'warning'
  return 'ok'
}

function urgencyLabel(days) {
  if (days < 0) return `Expired ${Math.abs(days)}d ago`
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `${days} days left`
}

export default function ItemCard({ item, onDelete, onQuantityChange, onEdit }) {
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const days = daysUntil(item.expiryDate)
  const cls = urgencyClass(days)

  const handleDelete = async (action) => {
    await api.post('/logs', {
      itemName: item.name,
      action,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price || 0,
      totalValue: (item.price || 0) * item.quantity,
    })
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
          <div className={`item-expiry expiry--${cls}`}>{urgencyLabel(days)}</div>
          {item.price > 0 && <div className="item-price">€{item.price.toFixed(2)}</div>}

          {confirming ? (
            <div className="delete-confirm">
              <p className="delete-prompt-text">Used up?</p>
              <div className="delete-actions">
                <button className="btn-action btn-consumed" onClick={() => handleDelete('consumed')}>✓ Consumed</button>
                <button className="btn-action btn-wasted" onClick={() => handleDelete('wasted')}>✗ Wasted</button>
                <button className="btn-action btn-cancel" onClick={() => setConfirming(false)}>Keep</button>
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
                <button onClick={() => setEditing(true)} className="btn-icon" title="Edit">✎</button>
                <button onClick={() => setConfirming(true)} className="btn-icon btn-icon--danger" title="Remove">✕</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && <EditModal item={item} onSave={onEdit} onClose={() => setEditing(false)} />}
    </>
  )
}
