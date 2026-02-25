import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ New — verifies token + fetches fresh user from DB on every app load
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

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { user, token } = res.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const register = async (name, email, password, role = 'guest') => {
    const res = await api.post('/auth/register', { name, email, password, role })
    const { user, token } = res.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updated) => {
    const merged = { ...user, ...updated }
    localStorage.setItem('user', JSON.stringify(merged))
    setUser(merged)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)