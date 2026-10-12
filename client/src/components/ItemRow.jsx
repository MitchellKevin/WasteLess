import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { daysUntil, urgency, expiryLabel, freshness, totalQuantity } from '../lib/items'

// One pantry product: name, when its soonest batch expires, a freshness bar and where it's stored.
// Pass `batches` (soonest first) to show a product with several expiry dates as one row.
export default function ItemRow({ item, batches, showBar = true }) {
  const { t } = useTranslation()
  const all = batches?.length ? batches : [item]
  const first = all[0]
  const days = daysUntil(first.expiryDate)
  const level = urgency(days)
  const places = [...new Set(all.map((b) => b.location || 'fridge'))].map((l) => t(`location.${l}`)).join(', ')
  const amount = all.length > 1 ? (totalQuantity(all) ?? '') : `${first.quantity} ${first.unit}`

  return (
    <Link to={`/item/${first._id}`} className="item-row">
      <span className="item-row-main">
        <span className="item-row-top">
          <span className="item-row-name">{first.name}</span>
          <span className={`item-row-when when--${level}`}>{expiryLabel(t, days)}</span>
        </span>
        {showBar && (
          <span className="fresh-bar" aria-hidden="true">
            <span className={`fresh-fill fill--${level}`} style={{ width: `${freshness(first)}%` }} />
          </span>
        )}
        <span className="item-row-meta">
          {places}
          {all.length > 1 && <> · <span className="batch-count">{t('batches.count', { count: all.length })}</span></>}
          {amount && ` · ${amount}`}
        </span>
      </span>
    </Link>
  )
}
