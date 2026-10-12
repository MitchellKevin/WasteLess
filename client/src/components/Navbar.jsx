import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { LeafIcon, HomeIcon, PantryIcon, PlusIcon, RecipesIcon, ImpactIcon, SettingsIcon } from './Icons'

export default function Navbar() {
  const { user } = useAuth()
  const { t } = useTranslation()

  // Each tap plays the icon's own little animation. A new key remounts the icon,
  // so it replays even when the same tab is tapped again.
  const [tap, setTap] = useState({ name: null, n: 0 })
  const onTap = (name) => () => setTap((prev) => ({ name, n: prev.n + 1 }))
  const anim = (name) => (tap.name === name ? ` tap anim-${name}` : '')
  const iconKey = (name) => (tap.name === name ? `${name}-${tap.n}` : name)

  const navCls = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`
  const tabCls = (name) => ({ isActive }) => `tab-link${isActive ? ' active' : ''}${anim(name)}`

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
                className={({ isActive }) => `icon-btn${isActive ? ' active' : ''}${anim('settings')}`}
                aria-label={t('nav.account')}
                onClick={onTap('settings')}
              >
                <SettingsIcon key={iconKey('settings')} />
              </NavLink>
            </div>
          </>
        )}
      </header>

      {user && (
        <nav className="tabbar" aria-label="Main">
          <NavLink to="/" end className={tabCls('today')} onClick={onTap('today')}>
            <HomeIcon key={iconKey('today')} size={24} />{t('nav.today')}
          </NavLink>
          <NavLink to="/pantry" className={tabCls('pantry')} onClick={onTap('pantry')}>
            <PantryIcon key={iconKey('pantry')} size={24} />{t('nav.pantry')}
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => `tab-add${isActive ? ' active' : ''}${anim('add')}`} aria-label={t('nav.add')} onClick={onTap('add')}>
            <span className="tab-add-btn" key={iconKey('add')}><PlusIcon size={26} /></span>
          </NavLink>
          <NavLink to="/recipes" className={tabCls('recipes')} onClick={onTap('recipes')}>
            <RecipesIcon key={iconKey('recipes')} size={24} />{t('nav.recipes')}
          </NavLink>
          <NavLink to="/impact" className={tabCls('impact')} onClick={onTap('impact')}>
            <ImpactIcon key={iconKey('impact')} size={24} />{t('nav.impact')}
          </NavLink>
        </nav>
      )}
    </>
  )
}
