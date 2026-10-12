import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import { identify, forget } from '../lib/purchases'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const persist = (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    persist(data.token, data.user)
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    persist(data.token, data.user)
  }

  // Purchases belong to the logged-in WasteLess account
  useEffect(() => {
    if (user?.id) identify(user.id).catch(() => {})
  }, [user?.id])

  const logout = () => {
    forget()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const store = (next) => {
    localStorage.setItem('user', JSON.stringify(next))
    setUser(next)
  }

  const refreshUser = () =>
    api.get('/auth/me')
      .then(({ data }) => { store(data); return data })
      .catch((err) => { if (err.response?.status === 401) logout() })

  // Pick up preferences and Plus status (and catch expired sessions) on load
  useEffect(() => {
    if (localStorage.getItem('token')) refreshUser()
  }, [])

  const updateProfile = async (changes) => {
    const { data } = await api.patch('/auth/me', changes)
    store(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, refreshUser, setUser: store, persist }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
