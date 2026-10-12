import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError(t('auth.minPassword')); return }
    setError(''); setLoading(true)
    try { await register(form.name, form.email, form.password) }
    catch (err) { setError(err.response?.data?.message || t('common.error')) }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('auth.createAccount')}</h1>
        <p className="auth-subtitle">{t('auth.startToday')}</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-name">{t('auth.name')}</label>
            <input id="register-name" type="text" autoComplete="name" value={form.name} onChange={set('name')} required autoFocus />
          </div>
          <div className="form-group">
            <label htmlFor="register-email">{t('auth.email')}</label>
            <input id="register-email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label htmlFor="register-password">{t('auth.password')}</label>
            <input id="register-password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} required minLength={6} aria-describedby="register-password-hint" />
            <span className="form-hint" id="register-password-hint">{t('auth.minPassword')}</span>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? t('auth.creating') : t('auth.createAccount')}
          </button>
        </form>
        <p className="auth-link">{t('auth.alreadyHaveAccount')} <Link to="/login">{t('auth.signInLink')}</Link></p>
      </div>
    </div>
  )
}
