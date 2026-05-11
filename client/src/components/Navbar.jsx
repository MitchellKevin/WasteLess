import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navCls = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">
        <span>🌱</span> WasteLess
      </NavLink>

      {user && (
        <>
          <div className="nav-links">
            <NavLink to="/" end className={navCls}>Inventory</NavLink>
            <NavLink to="/recipes" className={navCls}>Recipes</NavLink>
            <NavLink to="/shopping" className={navCls}>Shopping</NavLink>
            <NavLink to="/stats" className={navCls}>Stats</NavLink>
            <NavLink to="/household" className={navCls}>Household</NavLink>
          </div>
          <div className="nav-right">
            <NavLink to="/add" className="btn btn-primary btn-sm">+ Add</NavLink>
            <NavLink to="/bulk-add" className="btn btn-secondary btn-sm">Bulk</NavLink>
            <button className="btn-theme" onClick={toggle} title="Toggle dark mode">
              {dark ? '☀️' : '🌙'}
            </button>
            <span className="nav-user">{user.name}</span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </div>
        </>
      )}
    </nav>
  )
}
