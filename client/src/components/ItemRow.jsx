import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { daysUntil, urgency, expiryLabel, freshness } from '../lib/items'

// One pantry item: name, when it expires, a freshness bar and where it's stored
export default function ItemRow({ item, showBar = true }) {
  const { t } = useTranslation()
  const days = daysUntil(item.expiryDate)
  const level = urgency(days)
  return (
    <Link to={`/item/${item._id}`} className="item-row">
      <span className="item-row-main">
        <span className="item-row-top">
          <span className="item-row-name">{item.name}</span>
          <span className={`item-row-when when--${level}`}>{expiryLabel(t, days)}</span>
        </span>
        {showBar && (
          <span className="fresh-bar" aria-hidden="true">
            <span className={`fresh-fill fill--${level}`} style={{ width: `${freshness(item)}%` }} />
          </span>
        )}
        <span className="item-row-meta">
          {t(`location.${item.location || 'fridge'}`)} · {item.quantity} {item.unit}
        </span>
      </span>
    </Link>
  )
}
