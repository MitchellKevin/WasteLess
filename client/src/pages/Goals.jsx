import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { BackIcon } from '../components/Icons'

const GOALS = [80, 85, 90, 95]
const BADGES = ['firstWeek', 'zeroWasteWeek', 'kg10', 'streak30', 'freezerHero', 'kg25']

export default function Goals() {
  const { t, i18n } = useTranslation()
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [impact, setImpact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/logs/impact').then(({ data }) => setImpact(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading" role="status">{t('common.loading')}</div>
  if (!impact) return <div className="alert alert-error" role="alert">{t('common.error')}</div>

  const target = user?.monthlyGoal ?? impact.goal.target
  const pct = impact.month.eatenPct
  const toGo = pct === null ? null : Math.max(0, target - pct)
  const monthName = new Date().toLocaleString(i18n.language, { month: 'long' })
  // Mon..Sun initials in the current language
  const dayNames = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(i18n.language, { weekday: 'narrow' }))

  return (
    <div className="page goals">
      <div className="detail-bar">
        <button type="button" className="btn btn-ghost btn-sm btn-back" onClick={() => navigate(-1)}><BackIcon size={20} />{t('detail.back')}</button>
      </div>
      <div className="page-header">
        <h1 className="headline">{t('goals.title')}</h1>
      </div>

      <section className="card goal-card" aria-labelledby="goal-title">
        <div className="goal-ring" style={{ '--pct': pct ?? 0 }} role="img" aria-label={pct === null ? t('impact.noneYet') : t('impact.eatenPct', { pct })}>
          <span className="goal-ring-value">{pct === null ? '–' : `${pct}%`}</span>
          <span className="goal-ring-label">{t('goals.eaten')}</span>
        </div>
        <div className="goal-text">
          <span className="card-label">{t('goals.monthGoal', { month: monthName })}</span>
          <h2 className="card-title" id="goal-title">{t('goals.eatPct', { pct: target })}</h2>
          <p className="card-note">
            {toGo === null ? t('impact.noneYet') : toGo === 0 ? t('goals.reached', { count: impact.goal.daysLeft }) : t('goals.toGo', { points: toGo, count: impact.goal.daysLeft })}
          </p>
        </div>
      </section>

      <section className="card" aria-labelledby="goal-pick">
        <h2 className="card-label" id="goal-pick">{t('goals.setGoal')}</h2>
        <div className="chip-row" role="radiogroup" aria-labelledby="goal-pick">
          {GOALS.map((g) => (
            <button key={g} type="button" role="radio" aria-checked={target === g}
              className={`chip${target === g ? ' active' : ''}`} onClick={() => updateProfile({ monthlyGoal: g })}>
              {g}%
            </button>
          ))}
        </div>
      </section>

      <section className="card streak-card" aria-labelledby="streak-title">
        <div className="streak-head">
          <p className="streak-figure"><span className="streak-number">{impact.streak}</span> <span id="streak-title">{t('goals.dayStreak', { count: impact.streak })}</span></p>
          <span className="card-meta">{t('goals.best', { count: impact.bestStreak })}</span>
        </div>
        <ol className="streak-days">
          {impact.week.map((s, i) => (
            <li key={i} className={`streak-day day--${s}`} aria-label={`${dayNames[i]}: ${t(`goals.day.${s}`)}`}>
              <span aria-hidden="true">{dayNames[i]}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="badges-title">
        <h2 className="section-heading" id="badges-title">{t('goals.badges')}</h2>
        <ul className="badge-grid">
          {BADGES.map((b) => {
            const earned = impact.badges[b]
            return (
              <li key={b} className={`badge${earned ? ' earned' : ''}`}>
                <span className="badge-name">{t(`goals.badge.${b}`)}</span>
                <span className="badge-state">{earned ? t('goals.earned') : t('goals.locked')}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
