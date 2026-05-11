import { useEffect, useState } from 'react'
import api from '../api/axios'

function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
}

export default function Stats() {
  const [stats, setStats] = useState({})
  const [view, setView] = useState('count')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/logs/stats').then(({ data }) => setStats(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading stats…</div>

  const months = Object.keys(stats).sort()
  const totalConsumed = months.reduce((s, k) => s + stats[k].consumed, 0)
  const totalWasted = months.reduce((s, k) => s + stats[k].wasted, 0)
  const totalConsumedValue = months.reduce((s, k) => s + (stats[k].consumedValue || 0), 0)
  const totalWastedValue = months.reduce((s, k) => s + (stats[k].wastedValue || 0), 0)
  const total = totalConsumed + totalWasted
  const savedPct = total === 0 ? 0 : Math.round((totalConsumed / total) * 100)

  const maxVal = months.reduce((m, k) => {
    const v = view === 'count'
      ? stats[k].consumed + stats[k].wasted
      : (stats[k].consumedValue || 0) + (stats[k].wastedValue || 0)
    return Math.max(m, v)
  }, 1)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Your Stats</h2>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card--green">
          <div className="stat-number">{totalConsumed}</div>
          <div className="stat-label">Items consumed</div>
          {totalConsumedValue > 0 && <div className="stat-value">€{totalConsumedValue.toFixed(2)} saved</div>}
        </div>
        <div className="stat-card stat-card--red">
          <div className="stat-number">{totalWasted}</div>
          <div className="stat-label">Items wasted</div>
          {totalWastedValue > 0 && <div className="stat-value">€{totalWastedValue.toFixed(2)} lost</div>}
        </div>
        <div className="stat-card stat-card--blue">
          <div className="stat-number">{savedPct}%</div>
          <div className="stat-label">Food saved rate</div>
          {(totalConsumedValue + totalWastedValue) > 0 && (
            <div className="stat-value">
              €{(totalConsumedValue + totalWastedValue).toFixed(2)} tracked
            </div>
          )}
        </div>
      </div>

      {months.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <p>No data yet — remove items from your inventory as you use or waste them to start tracking.</p>
        </div>
      ) : (
        <div className="chart-section">
          <div className="chart-header">
            <h3 className="section-title" style={{ margin: 0 }}>Monthly breakdown</h3>
            <div className="view-toggle">
              <button className={`view-btn ${view === 'count' ? 'active' : ''}`} onClick={() => setView('count')}>Count</button>
              <button className={`view-btn ${view === 'value' ? 'active' : ''}`} onClick={() => setView('value')}>Value (€)</button>
            </div>
          </div>
          <div className="chart-legend">
            <span className="legend-dot legend-dot--green" /> Consumed
            <span className="legend-dot legend-dot--red" style={{ marginLeft: '1rem' }} /> Wasted
          </div>
          <div className="chart">
            {months.map((key) => {
              const consumed = view === 'count' ? stats[key].consumed : (stats[key].consumedValue || 0)
              const wasted = view === 'count' ? stats[key].wasted : (stats[key].wastedValue || 0)
              const cPct = ((consumed / maxVal) * 100).toFixed(1)
              const wPct = ((wasted / maxVal) * 100).toFixed(1)
              return (
                <div key={key} className="chart-row">
                  <div className="chart-label">{monthLabel(key)}</div>
                  <div className="chart-bars">
                    {consumed > 0 && (
                      <div className="chart-bar chart-bar--green" style={{ width: `${cPct}%` }}>
                        <span>{view === 'value' ? `€${consumed.toFixed(2)}` : consumed}</span>
                      </div>
                    )}
                    {wasted > 0 && (
                      <div className="chart-bar chart-bar--red" style={{ width: `${wPct}%` }}>
                        <span>{view === 'value' ? `€${wasted.toFixed(2)}` : wasted}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
