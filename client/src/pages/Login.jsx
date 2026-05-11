import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form.email, form.password) }
    catch (err) { setError(err.response?.data?.message || t('common.error')) }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌱</div>
        <h1>{t('auth.welcomeBack')}</h1>
        <p className="auth-subtitle">{t('auth.signInSubtitle')}</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input type="email" value={form.email} onChange={set('email')} required autoFocus />
          </div>
          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input type="password" value={form.password} onChange={set('password')} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
        <p className="auth-link">{t('auth.noAccount')} <Link to="/register">{t('auth.createOne')}</Link></p>
      </div>
    </div>
  )
}
