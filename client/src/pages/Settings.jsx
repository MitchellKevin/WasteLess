import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { remindLabel, formatDate } from '../lib/items'
import { isPlus } from '../lib/plan'
import { openExternal, LEGAL, MANAGE_SUBSCRIPTIONS } from '../lib/native'
import { HouseholdIcon, BellIcon, TargetIcon, ChevronIcon, LogoutIcon, PencilIcon, LeafIcon } from '../components/Icons'

export const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free']

export function Segmented({ label, value, options, onChange }) {
  return (
    <div className="segmented segmented--inline" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`segmented-item${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ProfileCard() {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try { await updateProfile(form); setEditing(false) }
    catch (err) { setError(err.response?.data?.message || t('common.error')) }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <form className="card profile-form" onSubmit={save}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="form-group">
          <label htmlFor="profile-name">{t('auth.name')}</label>
          <input id="profile-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label htmlFor="profile-email">{t('auth.email')}</label>
          <input id="profile-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email }) }}>{t('edit.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('edit.saving') : t('edit.save')}</button>
        </div>
      </form>
    )
  }

  return (
    <div className="card settings-profile">
      <span className="member-avatar member-avatar--lg" aria-hidden="true">{user?.name?.[0]?.toUpperCase()}</span>
      <div className="settings-profile-text">
        <span className="member-name">{user?.name}</span>
        <span className="member-email">{user?.email}</span>
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} aria-label={t('settings.editProfile')}>
        <PencilIcon size={18} />{t('settings.edit')}
      </button>
    </div>
  )
}

export default function Settings() {
  const { user, logout, updateProfile } = useAuth()
  const { mode, setMode } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [members, setMembers] = useState(null)
  const lang = i18n.language?.startsWith('nl') ? 'nl' : 'en'
  const diet = user?.diet || []

  useEffect(() => {
    api.get('/households/me').then(({ data }) => setMembers(data ? data.members.length : 0)).catch(() => {})
  }, [])

  const setLang = (next) => {
    i18n.changeLanguage(next)
    try { localStorage.setItem('lang', next) } catch {}
  }

  const toggleDiet = (d) => updateProfile({ diet: diet.includes(d) ? diet.filter((x) => x !== d) : [...diet, d] })

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deleteAccount = async () => {
    const store = user?.plus?.own && !user.plus.canceled && user.plus.store
    if (!confirm(store ? `${t('settings.deleteConfirm')}\n\n${t('settings.deleteStore')}` : t('settings.deleteConfirm'))) return
    setDeleting(true); setDeleteError('')
    try {
      await api.delete('/auth/me')
      if (store) openExternal(MANAGE_SUBSCRIPTIONS[store])
      logout()
      navigate('/register')
    } catch (err) {
      setDeleteError(err.response?.data?.message || t('common.error'))
      setDeleting(false)
    }
  }

  const handleLogout = () => {
    if (!confirm(t('settings.logoutConfirm'))) return
    logout()
    navigate('/login')
  }

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1 className="headline">{t('settings.title')}</h1>
      </div>

      <ProfileCard />

      <Link to="/plus" className={`plus-row${isPlus(user) ? ' plus-row--active' : ''}`}>
        <span className="plus-mark plus-mark--sm" aria-hidden="true"><LeafIcon size={20} /></span>
        <span className="link-card-text">
          <span className="link-card-title">WasteLess Plus</span>
          <span className="link-card-desc">
            {isPlus(user)
              ? (user.plus.own && user.plus.until ? t('plus.activeUntil', { date: formatDate(user.plus.until, i18n.language, { day: 'numeric', month: 'long' }) }) : t('plus.activeShort'))
              : t('plus.rowDesc')}
          </span>
        </span>
        <ChevronIcon size={20} className="link-card-chevron" />
      </Link>

      <section className="settings-group" aria-labelledby="settings-account">
        <h2 className="section-title" id="settings-account">{t('settings.account')}</h2>
        <div className="card settings-list">
          <Link to="/household" className="settings-row">
            <HouseholdIcon className="settings-row-icon" />
            <span className="settings-row-title">{t('nav.household')}</span>
            <span className="settings-row-value">
              {members === null ? '' : members === 0 ? t('settings.noHousehold') : t('settings.members', { count: members })}
            </span>
            <ChevronIcon size={20} className="settings-row-chevron" />
          </Link>
          <Link to="/settings/notifications" className="settings-row">
            <BellIcon className="settings-row-icon" />
            <span className="settings-row-title">{t('notifications.title')}</span>
            <span className="settings-row-value">{remindLabel(t, user?.notifyDaysBefore ?? 2)}</span>
            <ChevronIcon size={20} className="settings-row-chevron" />
          </Link>
          <Link to="/goals" className="settings-row">
            <TargetIcon className="settings-row-icon" />
            <span className="settings-row-title">{t('goals.title')}</span>
            <span className="settings-row-value">{t('goals.eatPct', { pct: user?.monthlyGoal ?? 90 })}</span>
            <ChevronIcon size={20} className="settings-row-chevron" />
          </Link>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="settings-food">
        <h2 className="section-title" id="settings-food">{t('settings.food')}</h2>
        <div className="card">
          <h3 className="card-label" id="settings-diet">{t('settings.diet')}</h3>
          <p className="card-note">{t('settings.dietDesc')}</p>
          <div className="chip-row" role="group" aria-labelledby="settings-diet">
            {DIETS.map((d) => (
              <button key={d} type="button" className={`chip${diet.includes(d) ? ' active' : ''}`} aria-pressed={diet.includes(d)} onClick={() => toggleDiet(d)}>
                {t(`diet.${d}`)}
              </button>
            ))}
          </div>
        </div>
        <h3 className="field-label" id="settings-units">{t('settings.units')}</h3>
        <Segmented
          label={t('settings.units')}
          value={user?.units || 'metric'}
          onChange={(units) => updateProfile({ units })}
          options={[{ value: 'metric', label: t('settings.metric') }, { value: 'imperial', label: t('settings.imperial') }]}
        />
      </section>

      <section className="settings-group" aria-labelledby="settings-appearance">
        <h2 className="section-title" id="settings-appearance">{t('settings.appearance')}</h2>
        <h3 className="field-label">{t('settings.theme')}</h3>
        <Segmented
          label={t('settings.theme')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'system', label: t('settings.system') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
        <h3 className="field-label">{t('settings.language')}</h3>
        <Segmented
          label={t('settings.language')}
          value={lang}
          onChange={setLang}
          options={[{ value: 'nl', label: 'Nederlands' }, { value: 'en', label: 'English' }]}
        />
      </section>

      <button type="button" className="btn btn-secondary btn-full btn-danger-text" onClick={handleLogout}>
        <LogoutIcon size={20} />{t('settings.logout')}
      </button>

      <section className="settings-group" aria-labelledby="settings-about">
        <h2 className="section-title" id="settings-about">{t('settings.about')}</h2>
        <div className="card settings-list">
          {LEGAL.privacy && (
            <button type="button" className="settings-row" onClick={() => openExternal(LEGAL.privacy)}>
              <span className="settings-row-title">{t('legal.privacy')}</span>
              <ChevronIcon size={20} className="settings-row-chevron" />
            </button>
          )}
          <button type="button" className="settings-row" onClick={() => openExternal(LEGAL.terms)}>
            <span className="settings-row-title">{t('legal.terms')}</span>
            <ChevronIcon size={20} className="settings-row-chevron" />
          </button>
        </div>
      </section>

      {deleteError && <div className="alert alert-error" role="alert">{deleteError}</div>}
      <button type="button" className="btn btn-ghost btn-danger-text delete-account" onClick={deleteAccount} disabled={deleting}>
        {deleting ? t('settings.deleting') : t('settings.deleteAccount')}
      </button>
    </div>
  )
}
