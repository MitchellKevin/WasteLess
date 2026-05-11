import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ItemCard from '../components/ItemCard'

const MS_PER_DAY = 86400000

function daysUntil(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.round((exp - now) / MS_PER_DAY)
}

function requestNotificationPermission(expiring) {
  if (!('Notification' in window) || Notification.permission === 'denied') return
  const notify = () => {
    if (expiring.length > 0) {
      new Notification('WasteLess Alert', {
        body: `${expiring.length} item${expiring.length > 1 ? 's' : ''} expiring soon: ${expiring.slice(0, 3).map((i) => i.name).join(', ')}`,
        icon: '/icon.svg',
      })
    }
  }
  if (Notification.permission === 'granted') notify()
  else Notification.requestPermission().then((p) => { if (p === 'granted') notify() })
}

const SORT_OPTIONS = [
  { value: 'expiry', label: 'Expiry date' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'category', label: 'Category' },
  { value: 'added', label: 'Recently added' },
]

function applySortAndSearch(items, sort, search) {
  let result = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : [...items]
  switch (sort) {
    case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break
    case 'category': result.sort((a, b) => (a.category || '').localeCompare(b.category || '')); break
    case 'added': result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break
    default: result.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
  }
  return result
}

export default function Dashboard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('expiry')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/items').then(({ data }) => {
      setItems(data)
      const expiring = data.filter((i) => { const d = daysUntil(i.expiryDate); return d >= 0 && d <= 3 })
      if (expiring.length > 0) requestNotificationPermission(expiring)
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = (id) => setItems((prev) => prev.filter((i) => i._id !== id))
  const handleQtyChange = (updated) => setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)))
  const handleEdit = (updated) => setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)))

  const expiredItems = items.filter((i) => daysUntil(i.expiryDate) < 0)
  const expiringItems = items.filter((i) => { const d = daysUntil(i.expiryDate); return d >= 0 && d <= 3 })

  const filtered = (() => {
    switch (filter) {
      case 'expiring': return items.filter((i) => { const d = daysUntil(i.expiryDate); return d >= 0 && d <= 7 })
      case 'ok': return items.filter((i) => daysUntil(i.expiryDate) > 7)
      default: return items
    }
  })()

  const displayed = applySortAndSearch(filtered, sort, search)

  if (loading) return <div className="loading">Loading your inventory…</div>

  return (
    <div className="dashboard">
      {(expiredItems.length > 0 || expiringItems.length > 0) && (
        <div className="alert-banner">
          {expiredItems.length > 0 && (
            <div className="alert alert-error">
              ⚠️ {expiredItems.length} item{expiredItems.length > 1 ? 's have' : ' has'} expired — consider removing them.
            </div>
          )}
          {expiringItems.length > 0 && (
            <div className="alert alert-warning">
              🕐 {expiringItems.length} item{expiringItems.length > 1 ? 's' : ''} expiring within 3 days: {expiringItems.map((i) => i.name).join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-toolbar">
        <div className="toolbar-left">
          <h2>Inventory <span className="item-count">{items.length}</span></h2>
          <div className="filter-tabs">
            {['all', 'expiring', 'ok'].map((f) => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'expiring' ? 'Expiring' : 'Fresh'}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="search-input"
            />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="empty-state">
          <p>{search ? `No items matching "${search}"` : items.length === 0 ? 'Your inventory is empty.' : 'No items in this category.'}</p>
          {items.length === 0 && <Link to="/add" className="btn btn-primary">Add your first item</Link>}
        </div>
      ) : (
        <div className="item-grid">
          {displayed.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onDelete={handleDelete}
              onQuantityChange={handleQtyChange}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
