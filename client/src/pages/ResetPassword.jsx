import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const MIN_PASSWORD = 6

// Opened from the link in the reset email: ?token=…
export default function ResetPassword() {
  const { t } = useTranslation()
  const { persist } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [invalid, setInvalid] = useState(!token)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (password !== repeat) { setError(t('auth.passwordsDontMatch')); return }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', { token, password })
      persist(data.token, data.user)
      navigate('/', { replace: true })
    } catch (err) {
      if (err.response?.data?.code === 'invalid_token') setInvalid(true)
      else setError(err.response?.data?.code === 'password_too_short' ? t('auth.minPassword') : err.response?.data?.message || t('common.error'))
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('auth.resetTitle')}</h1>
        {invalid ? (
          <>
            <div className="alert alert-error" role="alert">{t('auth.resetInvalid')}</div>
            <p className="auth-link"><Link to="/forgot-password">{t('auth.requestNewLink')}</Link></p>
          </>
        ) : (
          <>
            <p className="auth-subtitle">{t('auth.resetSubtitle')}</p>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label htmlFor="reset-password">{t('auth.newPassword')}</label>
                <input id="reset-password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD}
                  value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus aria-describedby="reset-hint" />
                <span className="form-hint" id="reset-hint">{t('auth.minPassword')}</span>
              </div>
              <div className="form-group">
                <label htmlFor="reset-repeat">{t('auth.repeatPassword')}</label>
                <input id="reset-repeat" type="password" autoComplete="new-password" minLength={MIN_PASSWORD}
                  value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? t('auth.saving') : t('auth.savePassword')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
