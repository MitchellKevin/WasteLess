import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { BarcodeIcon, PencilIcon, CheckIcon } from './Icons'

// First-run state: ways to add items plus a short setup checklist
export default function EmptyPantry({ itemCount = 0 }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const steps = [
    { done: itemCount >= 5, label: t('empty.stepItems', { count: Math.min(itemCount, 5) }), to: '/add' },
    { done: !!user?.remindersChosen, label: t('empty.stepReminders'), to: '/settings/notifications' },
    { done: !!user?.household, label: t('empty.stepHousehold'), to: '/household' },
  ]
  const done = steps.filter((s) => s.done).length

  return (
    <div className="empty-pantry">
      <div className="empty-hero">
        <h2>{t('empty.title')}</h2>
        <p>{t('empty.desc')}</p>
        <div className="empty-actions">
          <Link to="/add?scan=1" className="btn btn-primary"><BarcodeIcon size={20} />{t('empty.scan')}</Link>
          <Link to="/add" className="btn btn-secondary"><PencilIcon size={20} />{t('empty.byHand')}</Link>
        </div>
      </div>
      <section className="card setup-list" aria-labelledby="setup-title">
        <div className="card-head">
          <h3 id="setup-title">{t('empty.setup')}</h3>
          <span className="card-meta">{t('empty.progress', { done, total: steps.length })}</span>
        </div>
        <ol>
          {steps.map((s) => (
            <li key={s.to}>
              <Link to={s.to} className={`setup-step${s.done ? ' done' : ''}`}>
                <span className="setup-check" aria-hidden="true">{s.done && <CheckIcon size={14} />}</span>
                <span>{s.label}</span>
                <span className="sr-only">{s.done ? t('empty.done') : t('empty.todo')}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
