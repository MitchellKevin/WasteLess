import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { CloseIcon } from '../components/Icons'

const MS_PER_DAY = 86400000

function daysUntil(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.round((exp - now) / MS_PER_DAY)
}

export default function ShoppingList() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [checked, setChecked] = useState({})
  const [custom, setCustom] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shopping_custom')) || [] } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/items').then(({ data }) => {
      const needs = data.filter((i) => i.quantity === 0 || daysUntil(i.expiryDate) < 0)
      setItems(needs)
    }).finally(() => setLoading(false))
  }, [])

  const saveCustom = (list) => {
    setCustom(list)
    localStorage.setItem('shopping_custom', JSON.stringify(list))
  }

  const addCustom = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    saveCustom([...custom, { id: Date.now(), name: input.trim() }])
    setInput('')
  }

  const removeCustom = (id) => saveCustom(custom.filter((c) => c.id !== id))

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))

  if (loading) return <div className="loading" role="status">{t('shopping.loading')}</div>

  const total = items.length + custom.length
  const done = Object.values(checked).filter(Boolean).length

  return (
    <div className="page">
      <div className="page-header">
        <h2>{t('shopping.title')}</h2>
        {total > 0 && (
          <span className="item-count" aria-live="polite">{t('shopping.done', { done, total })}</span>
        )}
      </div>

      {items.length > 0 && (
        <section className="shopping-section" aria-labelledby="shopping-restock">
          <h3 className="section-title" id="shopping-restock">{t('shopping.needsRestocking')}</h3>
          <ul className="shopping-list">
            {items.map((item) => (
              <li key={item._id} className={`shopping-item ${checked[item._id] ? 'checked' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checked[item._id]}
                    onChange={() => toggle(item._id)}
                  />
                  <span className="shopping-name">{item.name}</span>
                  <span className="shopping-reason">
                    {item.quantity === 0 ? t('shopping.outOfStock') : t('shopping.expired')}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="shopping-section" aria-labelledby="shopping-mine">
        <h3 className="section-title" id="shopping-mine">{t('shopping.myList')}</h3>
        <form onSubmit={addCustom} className="shopping-add">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('shopping.addPlaceholder')}
            aria-label={t('shopping.addLabel')}
            enterKeyHint="done"
          />
          <button type="submit" className="btn btn-primary btn-sm">{t('shopping.add')}</button>
        </form>
        {custom.length > 0 && (
          <ul className="shopping-list">
            {custom.map((c) => (
              <li key={c.id} className={`shopping-item ${checked[c.id] ? 'checked' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checked[c.id]}
                    onChange={() => toggle(c.id)}
                  />
                  <span className="shopping-name">{c.name}</span>
                </label>
                <button type="button" className="btn-icon btn-icon--danger" onClick={() => removeCustom(c.id)} aria-label={t('shopping.remove', { name: c.name })}>
                  <CloseIcon size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {total === 0 && (
        <div className="empty-state">
          <p>{t('shopping.empty')}</p>
          <Link to="/" className="btn btn-primary">{t('shopping.viewInventory')}</Link>
        </div>
      )}
    </div>
  )
}
