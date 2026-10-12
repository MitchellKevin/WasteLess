import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { BackIcon } from '../components/Icons'
import { remindLabel } from '../lib/items'
import { notificationPermission, requestNotificationPermission } from '../lib/reminders'

const OPTIONS = [0, 1, 2, 3]

export default function NotificationSettings() {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [permission, setPermission] = useState('default')

  useEffect(() => { notificationPermission().then(setPermission).catch(() => setPermission('unsupported')) }, [])
  const current = user?.notifyDaysBefore ?? 2

  const choose = async (n) => {
    setError('')
    try { await updateProfile({ notifyDaysBefore: n }) }
    catch (err) { setError(err.response?.data?.message || t('common.error')) }
  }

  const allow = () => requestNotificationPermission().then(setPermission)

  return (
    <div className="page settings-page">
      <div className="detail-bar">
        <button type="button" className="btn btn-ghost btn-sm btn-back" onClick={() => navigate(-1)}><BackIcon size={20} />{t('detail.back')}</button>
      </div>
      <div className="page-header">
        <h1 className="headline">{t('notifications.title')}</h1>
        <p className="page-subtitle">{t('notifications.desc')}</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <section className="card" aria-labelledby="remind-title">
        <h2 className="card-label" id="remind-title">{t('notifications.remindMe')}</h2>
        <div className="chip-row" role="radiogroup" aria-labelledby="remind-title">
          {OPTIONS.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={current === n}
              className={`chip${current === n ? ' active' : ''}`} onClick={() => choose(n)}>
              {remindLabel(t, n)}
            </button>
          ))}
        </div>
        <p className="card-note">{t('notifications.how')}</p>
      </section>

      <section className="card" aria-labelledby="perm-title">
        <h2 className="card-label" id="perm-title">{t('notifications.browser')}</h2>
        <p className="card-note">{t(`notifications.perm.${permission === 'prompt' || permission === 'prompt-with-rationale' ? 'default' : permission}`)}</p>
        {['default', 'prompt', 'prompt-with-rationale'].includes(permission) && (
          <button type="button" className="btn btn-primary btn-sm" onClick={allow}>{t('notifications.allow')}</button>
        )}
      </section>
    </div>
  )
}
