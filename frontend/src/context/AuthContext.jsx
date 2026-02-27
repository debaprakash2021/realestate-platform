import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

// ─── Pending Action Helpers ────────────────────────────────────────────────
// Used to save what an unauthenticated user was trying to do (book, favorite,
// message) so we can restore their UI state seamlessly after they log in.
const PENDING_ACTION_KEY = 'pendingAction'

export const savePendingAction = (action) => {
  // action: { type, returnTo, propertyId, bookingData?, ... }
  sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action))
}

export const consumePendingAction = () => {
  const raw = sessionStorage.getItem(PENDING_ACTION_KEY)
  if (!raw) return null
  sessionStorage.removeItem(PENDING_ACTION_KEY)
  try { return JSON.parse(raw) } catch { return null }
}

export const getPendingAction = () => {
  const raw = sessionStorage.getItem(PENDING_ACTION_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

const AuthContext = createContext()

// FIX #10: Normalize user object so user.id is ALWAYS a string.
// After login, the server returns { id: ObjectId, ... } (explicit id field).
// After /auth/me, the server returns a full Mongoose document where _id is present
// and `id` is a virtual. Downstream components (Messages, PropertyDetail) use
// user.id for ID comparisons — if it's missing or an ObjectId instead of a string,
// comparisons silently fail. This helper ensures consistent shape everywhere.
const normalizeUser = (userData) => {
  if (!userData) return null
  return {
    ...userData,
    id: (userData.id || userData._id)?.toString()
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On every app load: verify token and fetch fresh user from DB
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(res => {
        const freshUser = normalizeUser(res.data.data)
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
    const { user: rawUser, token } = res.data.data
    const normalizedUser = normalizeUser(rawUser)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    setUser(normalizedUser)
    return normalizedUser
  }

  // ─── Register ─────────────────────────────────────────────────
  const register = async (name, email, password, role = 'guest') => {
    const res = await api.post('/auth/register', { name, email, password, role })
    return res.data.data
  }

  // ─── Called after OTP verified ────────────────────────────────
  const setLoggedIn = (userData, token) => {
    const normalizedUser = normalizeUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    setUser(normalizedUser)
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
    const merged = normalizeUser({ ...user, ...updated })
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