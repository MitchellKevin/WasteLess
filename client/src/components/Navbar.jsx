import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LeafIcon, HomeIcon, PantryIcon, PlusIcon, RecipesIcon, ImpactIcon, SettingsIcon } from './Icons'

export default function Navbar() {
  const { user } = useAuth()
  const { t } = useTranslation()

  const navCls = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`
  const tabCls = ({ isActive }) => `tab-link${isActive ? ' active' : ''}`

  return (
    <>
      <header className="navbar">
        <NavLink to="/" className="nav-brand"><LeafIcon size={24} className="nav-brand-icon" /> WasteLess</NavLink>
        {user && (
          <>
            <nav className="nav-links" aria-label="Main">
              <NavLink to="/" end className={navCls}>{t('nav.today')}</NavLink>
              <NavLink to="/pantry" className={navCls}>{t('nav.pantry')}</NavLink>
              <NavLink to="/recipes" className={navCls}>{t('nav.recipes')}</NavLink>
              <NavLink to="/shopping" className={navCls}>{t('nav.shopping')}</NavLink>
              <NavLink to="/impact" className={navCls}>{t('nav.impact')}</NavLink>
              <NavLink to="/household" className={navCls}>{t('nav.household')}</NavLink>
            </nav>
            <div className="nav-right">
              <NavLink to="/add" className="btn btn-primary btn-sm nav-add"><PlusIcon size={18} />{t('nav.add')}</NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) => `icon-btn${isActive ? ' active' : ''}`}
                aria-label={t('nav.account')}
              >
                <SettingsIcon />
              </NavLink>
            </div>
          </>
        )}
      </header>

      {user && (
        <nav className="tabbar" aria-label="Main">
          <NavLink to="/" end className={tabCls}><HomeIcon size={24} />{t('nav.today')}</NavLink>
          <NavLink to="/pantry" className={tabCls}><PantryIcon size={24} />{t('nav.pantry')}</NavLink>
          <NavLink to="/add" className={({ isActive }) => `tab-add${isActive ? ' active' : ''}`} aria-label={t('nav.add')}>
            <span className="tab-add-btn"><PlusIcon size={26} /></span>
          </NavLink>
          <NavLink to="/recipes" className={tabCls}><RecipesIcon size={24} />{t('nav.recipes')}</NavLink>
          <NavLink to="/impact" className={tabCls}><ImpactIcon size={24} />{t('nav.impact')}</NavLink>
        </nav>
      )}
    </>
  )
}
