import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)
  const handleLogout = () => { logout(); navigate('/login'); close() }
  const navCls = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  const toggleLang = () => {
    const next = i18n.language === 'nl' ? 'en' : 'nl'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <>
      <nav className="navbar">
        <NavLink to="/" className="nav-brand" onClick={close}><span>🌱</span> WasteLess</NavLink>
        {user && (
          <>
            <div className="nav-links">
              <NavLink to="/" end className={navCls}>{t('nav.inventory')}</NavLink>
              <NavLink to="/recipes" className={navCls}>{t('nav.recipes')}</NavLink>
              <NavLink to="/shopping" className={navCls}>{t('nav.shopping')}</NavLink>
              <NavLink to="/stats" className={navCls}>{t('nav.stats')}</NavLink>
              <NavLink to="/household" className={navCls}>{t('nav.household')}</NavLink>
            </div>
            <div className="nav-right">
              <NavLink to="/add" className="btn btn-primary btn-sm">{t('nav.add')}</NavLink>
              <NavLink to="/bulk-add" className="btn btn-secondary btn-sm">{t('nav.bulk')}</NavLink>
              <NavLink to="/receipt" className="btn btn-secondary btn-sm">{t('nav.receipt')}</NavLink>
              <button className="btn-lang" onClick={toggleLang} title="Switch language">
                {i18n.language === 'nl' ? '🇳🇱' : '🇬🇧'}
              </button>
              <button className="btn-theme" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
              <span className="nav-user">{user.name}</span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">{t('nav.logout')}</button>
            </div>
            <button className="nav-hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? '✕' : '☰'}
            </button>
          </>
        )}
      </nav>

      {user && open && (
        <>
          <div className="nav-backdrop" onClick={close} />
          <div className="nav-mobile-menu">
            <NavLink to="/" end className={navCls} onClick={close}>{t('nav.inventory')}</NavLink>
            <NavLink to="/recipes" className={navCls} onClick={close}>{t('nav.recipes')}</NavLink>
            <NavLink to="/shopping" className={navCls} onClick={close}>{t('nav.shopping')}</NavLink>
            <NavLink to="/stats" className={navCls} onClick={close}>{t('nav.stats')}</NavLink>
            <NavLink to="/household" className={navCls} onClick={close}>{t('nav.household')}</NavLink>
            <div className="nav-mobile-divider" />
            <NavLink to="/add" className="btn btn-primary btn-sm" onClick={close}>{t('nav.add')}</NavLink>
            <NavLink to="/bulk-add" className="btn btn-secondary btn-sm" onClick={close}>{t('nav.bulk')}</NavLink>
            <NavLink to="/receipt" className="btn btn-secondary btn-sm" onClick={close}>{t('nav.receipt')}</NavLink>
            <div className="nav-mobile-divider" />
            <div className="nav-mobile-bottom">
              <button className="btn-lang" onClick={toggleLang}>{i18n.language === 'nl' ? '🇳🇱' : '🇬🇧'}</button>
              <button className="btn-theme" onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
              <span className="nav-user">{user.name}</span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">{t('nav.logout')}</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
