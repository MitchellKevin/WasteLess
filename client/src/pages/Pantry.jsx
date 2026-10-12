import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import ItemRow from '../components/ItemRow'
import EmptyPantry from '../components/EmptyPantry'
import { CartIcon, SearchIcon } from '../components/Icons'
import { daysUntil, LOCATIONS } from '../lib/items'
import { syncReminders } from '../lib/reminders'
import { isNative } from '../lib/native'
import { useAuth } from '../context/AuthContext'

const SECTIONS = [
  { key: 'expired', test: (d) => d < 0 },
  { key: 'now', test: (d) => d >= 0 && d <= 1 },
  { key: 'week', test: (d) => d > 1 && d <= 7 },
  { key: 'later', test: (d) => d > 7 },
]

export default function Pantry() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [place, setPlace] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/items').then(({ data }) => {
      setItems(data)
      if (isNative) syncReminders(data, user?.notifyDaysBefore ?? 2, t)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading" role="status">{t('dashboard.loading')}</div>
  if (items.length === 0) return <EmptyPantry itemCount={0} />

  const attention = items.filter((i) => daysUntil(i.expiryDate) <= 7).length
  const query = search.trim().toLowerCase()
  const shown = items
    .filter((i) => place === 'all' || (i.location || 'fridge') === place)
    .filter((i) => !query || i.name.toLowerCase().includes(query) || (i.category || '').toLowerCase().includes(query))
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))

  return (
    <div className="page pantry">
      <div className="page-header page-header--row">
        <div>
          <h1 className="headline">{t('pantry.title')}</h1>
          <p className="page-subtitle">{t('pantry.summary', { count: items.length, attention })}</p>
        </div>
        <Link to="/shopping" className="btn btn-secondary btn-sm"><CartIcon size={18} />{t('shopping.title')}</Link>
      </div>

      <div className="pantry-tools">
        <div className="search-wrap">
          <SearchIcon size={20} className="search-wrap-icon" />
          <input
            type="search"
            className="search-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dashboard.search')}
            aria-label={t('dashboard.searchLabel')}
            enterKeyHint="search"
          />
        </div>
        <div className="chip-row" role="group" aria-label={t('pantry.filterLabel')}>
          {['all', ...LOCATIONS].map((p) => (
            <button
              key={p}
              type="button"
              className={`chip${place === p ? ' active' : ''}`}
              aria-pressed={place === p}
              onClick={() => setPlace(p)}
            >
              {p === 'all' ? t('dashboard.filter.all') : t(`location.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state"><p>{query ? t('dashboard.noMatch', { query: search }) : t('dashboard.emptyFilter')}</p></div>
      ) : (
        SECTIONS.map(({ key, test }) => {
          const group = shown.filter((i) => test(daysUntil(i.expiryDate)))
          if (group.length === 0) return null
          return (
            <section key={key} className="item-list" aria-labelledby={`pantry-${key}`}>
              <h2 className={`group-title group--${key}`} id={`pantry-${key}`}>
                <span className="group-dot" aria-hidden="true" />
                {t(`pantry.group.${key}`)}
                <span className="group-count">{group.length}</span>
              </h2>
              {group.map((item) => <ItemRow key={item._id} item={item} />)}
            </section>
          )
        })
      )}
    </div>
  )
}
