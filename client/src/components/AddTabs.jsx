import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { isPlus } from '../lib/plan'

export default function AddTabs() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const badge = !isPlus(user) && <span className="plus-badge plus-badge--tab">Plus</span>
  const cls = ({ isActive }) => `segmented-item${isActive ? ' active' : ''}`
  return (
    <nav className="segmented" aria-label={t('add.title')}>
      <NavLink to="/add" className={cls}>{t('nav.single')}</NavLink>
      <NavLink to="/bulk-add" className={cls}>{t('nav.bulk')}{badge}</NavLink>
      <NavLink to="/receipt" className={cls}>{t('nav.receipt')}{badge}</NavLink>
    </nav>
  )
}
