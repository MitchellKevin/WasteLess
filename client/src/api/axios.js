import axios from 'axios'

// In the iOS/Android app there is no same-origin server, so the API address comes from the build
const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Session no longer valid (expired, or the account doesn't exist anymore): log out and go to login.
// A wrong password on the login form is also a 401, but that one is handled by the form itself.
api.interceptors.response.use(undefined, (error) => {
  const url = error.config?.url || ''
  if (error.response?.status === 401 && localStorage.getItem('token') && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return Promise.reject(error)
})

export default api
