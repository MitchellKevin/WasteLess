import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { isPlus } from '../lib/plan'
import { LeafIcon } from './Icons'

// Inline upsell shown in place of (or next to) a Plus-only feature
export function PlusCard({ title, desc }) {
  const { t } = useTranslation()
  return (
    <section className="plus-card" aria-label="WasteLess Plus">
      <span className="plus-mark plus-mark--sm" aria-hidden="true"><LeafIcon size={22} /></span>
      <div className="plus-card-text">
        <span className="plus-badge">Plus</span>
        <h2 className="plus-card-title">{title}</h2>
        {desc && <p className="card-note">{desc}</p>}
      </div>
      <Link to="/plus" className="btn btn-primary btn-sm">{t('plus.seePlans')}</Link>
    </section>
  )
}

// Renders children only for Plus households
export default function PlusGate({ feature, children }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  if (isPlus(user)) return children
  return <PlusCard title={t(`plus.gate.${feature}Title`)} desc={t(`plus.gate.${feature}Desc`)} />
}
