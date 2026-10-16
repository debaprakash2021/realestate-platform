import axios from 'axios'

const normalizeBaseURL = (value) => {
  const fallback = 'http://localhost:5000/api'
  if (!value) return fallback

  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return fallback

  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const api = axios.create({
  baseURL: normalizeBaseURL(import.meta.env.VITE_API_URL),
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api