import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LEGAL_DOCS, UPDATED, CONTACT_EMAIL } from '../lib/legal'
import { formatDate } from '../lib/items'
import { BackIcon } from '../components/Icons'

// Privacy policy, terms and account deletion. Public pages: Google Play links to them.
export default function Legal({ doc }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language?.startsWith('nl') ? 'nl' : 'en'
  const page = LEGAL_DOCS[lang][doc]

  return (
    <article className="page legal-page" aria-labelledby="legal-title">
      {window.history.length > 1 && (
        <div className="detail-bar">
          <button type="button" className="btn btn-ghost btn-sm btn-back" onClick={() => navigate(-1)}><BackIcon size={20} />{t('detail.back')}</button>
        </div>
      )}
      <div className="page-header">
        <h1 className="headline" id="legal-title">{page.title}</h1>
        <p className="page-subtitle">{t('legal.updated', { date: formatDate(UPDATED, i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
      </div>
      <p className="legal-intro">{page.intro}</p>
      {page.sections.map((s) => (
        <section key={s.h} className="legal-section">
          <h2 className="card-title">{s.h}</h2>
          {s.p.map((text, i) => <p key={i}>{text}</p>)}
        </section>
      ))}
      <p className="form-hint">{t('legal.contact')} <a className="text-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </article>
  )
}
