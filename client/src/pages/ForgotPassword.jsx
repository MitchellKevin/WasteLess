import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

export default function ForgotPassword() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email, lang: i18n.language?.startsWith('nl') ? 'nl' : 'en' })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('auth.forgotTitle')}</h1>
        {sent ? (
          <>
            <p className="auth-subtitle" role="status">{t('auth.forgotSent', { email })}</p>
            <p className="auth-link"><Link to="/login">{t('auth.backToLogin')}</Link></p>
          </>
        ) : (
          <>
            <p className="auth-subtitle">{t('auth.forgotSubtitle')}</p>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label htmlFor="forgot-email">{t('auth.email')}</label>
                <input id="forgot-email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? t('auth.sending') : t('auth.sendLink')}
              </button>
            </form>
            <p className="auth-link"><Link to="/login">{t('auth.backToLogin')}</Link></p>
          </>
        )}
      </div>
    </div>
  )
}
