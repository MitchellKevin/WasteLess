import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { ShareIcon, CheckIcon } from '../components/Icons'
import { PlusCard } from '../components/PlusGate'

export default function Household() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [activity, setActivity] = useState([])
  const [household, setHousehold] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [memberLimit, setMemberLimit] = useState(0)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get('/households/me').then(({ data }) => setHousehold(data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (household) api.get('/households/activity').then(({ data }) => setActivity(data)).catch(() => {})
  }, [household?._id])

  const shareInvite = async () => {
    const text = t('household.shareText', { code: household.inviteCode })
    if (navigator.share) {
      try { await navigator.share({ title: 'WasteLess', text }) } catch {}
    } else copyCode()
  }

  const when = (d) => {
    const mins = Math.round((Date.now() - new Date(d)) / 60000)
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    if (mins < 60) return rtf.format(-mins, 'minute')
    if (mins < 1440) return rtf.format(-Math.round(mins / 60), 'hour')
    return rtf.format(-Math.round(mins / 1440), 'day')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/households', { name: createName })
      setHousehold(data)
    } catch (err) {
      setError(err.response?.data?.message || t('household.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/households/join', { inviteCode: joinCode })
      setHousehold(data)
    } catch (err) {
      if (err.response?.data?.code === 'limit_members') setMemberLimit(err.response.data.limit)
      else setError(err.response?.data?.message || t('household.invalidCode'))
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm(t('household.leaveConfirm'))) return
    setBusy(true)
    try {
      await api.post('/households/leave')
      setHousehold(null)
    } catch (err) {
      setError(err.response?.data?.message || t('household.leaveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(household.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="loading" role="status">{t('common.loading')}</div>

  return (
    <div className="page household-page">
      <div className="page-header">
        <h2>{t('household.title')}</h2>
        <p className="page-subtitle">{t('household.subtitle')}</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {memberLimit > 0 && <PlusCard title={t('plus.gate.membersTitle', { count: memberLimit })} desc={t('plus.gate.membersDesc', { count: memberLimit })} />}

      {household ? (
        <div className="household-card">
          <div className="household-header">
            <div>
              <h3>{household.name}</h3>
              <p className="household-owner">{t('household.owner')} {household.owner.name}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm btn-danger-text" onClick={handleLeave} disabled={busy}>
              {t('household.leave')}
            </button>
          </div>

          <div className="invite-section">
            <p className="section-title">{t('household.inviteCode')}</p>
            <div className="invite-code-row">
              <span className="invite-code">{household.inviteCode}</span>
            </div>
            <p className="invite-hint">{t('household.inviteHint')}</p>
            <div className="action-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={shareInvite}><ShareIcon size={18} />{t('household.share')}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={copyCode} aria-label={copied ? t('household.copied') : t('household.copyLabel')}>
                {copied ? <><CheckIcon size={18} />{t('household.copied')}</> : t('household.copy')}
              </button>
            </div>
          </div>

          <div className="members-section">
            <p className="section-title">{t('household.members', { count: household.members.length })}</p>
            <ul className="members-list">
              {household.members.map((m) => (
                <li key={m._id} className="member-item">
                  <span className="member-avatar" aria-hidden="true">{m.name[0].toUpperCase()}</span>
                  <span className="member-text">
                    <span className="member-name">{m._id === user?.id ? t('household.you') : m.name}</span>
                    <span className="member-email">{m.email}</span>
                  </span>
                  <span className="member-badge">{m._id === household.owner._id ? t('household.ownerBadge') : t('household.member')}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="members-section">
            <p className="section-title">{t('household.activity')}</p>
            {activity.length === 0 ? (
              <p className="invite-hint">{t('household.noActivity')}</p>
            ) : (
              <ul className="activity-list">
                {activity.map((a) => (
                  <li key={a.id} className="activity-item">
                    <span className="member-avatar" aria-hidden="true">{a.user?.name?.[0]?.toUpperCase()}</span>
                    <span className="activity-text">
                      <span><strong>{a.user?._id === user?.id ? t('household.you') : a.user?.name}</strong> {t(`household.did.${a.action}`, { name: a.itemName, context: a.user?._id === user?.id ? 'self' : undefined })}</span>
                      <time className="member-email" dateTime={a.createdAt}>{when(a.createdAt)}</time>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="household-setup">
          <div className="setup-card">
            <h3>{t('household.create')}</h3>
            <p>{t('household.createDesc')}</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="household-name">{t('household.householdName')}</label>
                <input
                  id="household-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={t('household.namePlaceholder')}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                {t('household.createBtn')}
              </button>
            </form>
          </div>

          <div className="setup-divider">{t('household.or')}</div>

          <div className="setup-card">
            <h3>{t('household.join')}</h3>
            <p>{t('household.joinDesc')}</p>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label htmlFor="household-code">{t('household.codeLabel')}</label>
                <input
                  id="household-code"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t('household.codePlaceholder')}
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                {t('household.joinBtn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
