import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On every app load: verify token and fetch fresh user from DB
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(res => {
        const freshUser = res.data.data
        localStorage.setItem('user', JSON.stringify(freshUser))
        setUser(freshUser)
      })
      .catch(() => {
        // Token expired or invalid → force logout
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  // ─── Login ─────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { user, token } = res.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  // ─── Register ─────────────────────────────────────────────────
  // New flow: register only sends OTP — no token returned yet.
  // Returns { requiresVerification: true, email } so the UI can
  // switch to the OTP step.
  const register = async (name, email, password, role = 'guest') => {
    const res = await api.post('/auth/register', { name, email, password, role })
    return res.data.data // { requiresVerification, email, message }
  }

  // ─── Called after OTP verified ────────────────────────────────
  // Stores token + user in context without a page reload
  const setLoggedIn = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // ─── Logout ────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  // ─── Update user (profile edits etc) ──────────────────────────
  const updateUser = (updated) => {
    const merged = { ...user, ...updated }
    localStorage.setItem('user', JSON.stringify(merged))
    setUser(merged)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, setLoggedIn, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)