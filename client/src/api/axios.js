import axios from 'axios'

// In the iOS/Android app there is no same-origin server, so the API address comes from the build
const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
