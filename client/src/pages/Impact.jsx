import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatWeight } from '../lib/items'
import { formatEur } from '../lib/plan'
import { PlusCard } from '../components/PlusGate'

function monthLabel(key, lang) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString(lang, { month: 'short', year: '2-digit' })
}

export default function Impact() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [impact, setImpact] = useState(null)
  const [history, setHistory] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/logs/impact'), api.get('/logs/stats')])
      .then(([a, b]) => { setImpact(a.data); setHistory(b.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading" role="status">{t('stats.loading')}</div>
  if (!impact) return <div className="alert alert-error" role="alert">{t('common.error')}</div>

  const { month, lastMonthPct, weeks, streak, mostWasted } = impact
  const weight = formatWeight(month.rescuedKg, user?.units)
  const monthName = new Date().toLocaleString(i18n.language, { month: 'long' })
  const maxWeek = Math.max(1, ...weeks.map((w) => w.eaten + w.wasted))
  const months = Object.keys(history).sort().reverse()

  let summary = t('impact.noneYet')
  if (month.eatenPct !== null) {
    summary = lastMonthPct === null
      ? t('impact.eatenPct', { pct: month.eatenPct })
      : t('impact.eatenVs', { pct: month.eatenPct, last: lastMonthPct, dir: t(month.eatenPct >= lastMonthPct ? 'impact.up' : 'impact.down') })
  }

  return (
    <div className="page impact">
      <div className="page-header">
        <h1 className="headline">{t('impact.title')}</h1>
        <p className="page-subtitle">{t('impact.soFar', { month: monthName })}</p>
      </div>

      <section className="hero-card hero-card--stat" aria-labelledby="rescued-label">
        <span className="hero-eyebrow" id="rescued-label">{t('impact.rescued')}</span>
        <p className="hero-figure">
          <span className="hero-number">{weight.value}</span>
          <span className="hero-unit">{weight.unit}</span>
        </p>
        <p className="hero-meta">{summary}</p>
        <p className="hero-footnote">{t('impact.estimate')}</p>
      </section>

      <section className="card" aria-labelledby="weeks-title">
        <h2 className="card-title" id="weeks-title">{t('impact.eatenVsWasted')}</h2>
        <div className="chart-legend">
          <span><span className="legend-dot legend-dot--green" aria-hidden="true" />{t('item.consumed')}</span>
          <span><span className="legend-dot legend-dot--red" aria-hidden="true" />{t('item.wasted')}</span>
        </div>
        <div className="week-bars">
          {weeks.map((w, i) => (
            <div key={i} className="week-bar-col">
              <div className="week-bar" role="img" aria-label={t('impact.weekLabel', { n: i + 1, eaten: w.eaten, wasted: w.wasted })}>
                {w.wasted > 0 && <span className="week-bar-seg seg--wasted" style={{ height: `${(w.wasted / maxWeek) * 100}%` }} />}
                {w.eaten > 0 && <span className="week-bar-seg seg--eaten" style={{ height: `${(w.eaten / maxWeek) * 100}%` }} />}
              </div>
              <span className="week-bar-label" aria-hidden="true">{i === 3 ? t('impact.thisWeek') : t('impact.week', { n: i + 1 })}</span>
            </div>
          ))}
        </div>
      </section>

      {impact.report ? (
        <section className="card" aria-labelledby="report-title">
          <h2 className="card-title" id="report-title">{t('impact.report')}</h2>
          <div className="report-grid">
            <div className="report-cell">
              <span className="report-value report-value--good">{formatEur(impact.report.savedEur, i18n.language)}</span>
              <span className="card-note">{t('impact.moneySaved')}</span>
            </div>
            <div className="report-cell">
              <span className="report-value report-value--bad">{formatEur(impact.report.lostEur, i18n.language)}</span>
              <span className="card-note">{t('impact.moneyLost')}</span>
            </div>
            <div className="report-cell">
              <span className="report-value report-value--good">{formatWeight(impact.report.co2SavedKg, user?.units).value} {formatWeight(impact.report.co2SavedKg, user?.units).unit}</span>
              <span className="card-note">{t('impact.co2Saved')}</span>
            </div>
            <div className="report-cell">
              <span className="report-value report-value--bad">{formatWeight(impact.report.co2LostKg, user?.units).value} {formatWeight(impact.report.co2LostKg, user?.units).unit}</span>
              <span className="card-note">{t('impact.co2Lost')}</span>
            </div>
          </div>
          <p className="form-hint">{t('impact.reportNote')}</p>
        </section>
      ) : (
        <PlusCard title={t('plus.gate.reportTitle')} desc={t('plus.gate.reportDesc')} />
      )}

      <div className="tile-grid">
        <Link to="/goals" className="tile">
          <span className="tile-number">{streak}</span>
          <span className="tile-text">{t('impact.streak', { count: streak })}</span>
          <span className="tile-link">{t('impact.viewGoals')}</span>
        </Link>
        <div className="tile tile--warn">
          <span className="tile-eyebrow">{t('impact.mostWasted')}</span>
          {mostWasted ? (
            <>
              <span className="tile-title">{mostWasted.name}</span>
              <span className="tile-text">{t('impact.mostWastedTip', { count: mostWasted.count })}</span>
            </>
          ) : (
            <span className="tile-text">{t('impact.nothingWasted')}</span>
          )}
        </div>
      </div>

      {months.length > 0 && (
        <section className="card" aria-labelledby="history-title">
          <h2 className="card-title" id="history-title">{t('stats.monthly')}</h2>
          <table className="history-table">
            <thead>
              <tr><th scope="col">{t('impact.month')}</th><th scope="col">{t('item.consumed')}</th><th scope="col">{t('item.wasted')}</th>{impact.report && <th scope="col">{t('impact.lost')}</th>}</tr>
            </thead>
            <tbody>
              {months.map((k) => (
                <tr key={k}>
                  <th scope="row">{monthLabel(k, i18n.language)}</th>
                  <td>{history[k].consumed}</td>
                  <td>{history[k].wasted}</td>
                  {impact.report && <td>{formatEur(history[k].wastedValue || 0, i18n.language)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
