import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar         from './components/layout/Navbar'
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import Home           from './pages/shared/Home'
import PropertyDetail from './pages/shared/PropertyDetail'
import MyBookings     from './pages/guest/MyBookings'
import Favorites      from './pages/guest/Favorites'
import Messages       from './pages/guest/Messages'
import Profile        from './pages/guest/Profile'
import HostDashboard  from './pages/host/HostDashboard'
import MyProperties   from './pages/host/MyProperties'
import CreateProperty from './pages/host/CreateProperty'
import EditProperty   from './pages/host/EditProperty'   // ✅ NEW

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"             element={<Home />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />

        {/* Guest */}
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/favorites"   element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/messages"    element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Host */}
        <Route path="/host/dashboard"            element={<ProtectedRoute roles={['host','admin']}><HostDashboard /></ProtectedRoute>} />
        <Route path="/host/properties"           element={<ProtectedRoute roles={['host','admin']}><MyProperties /></ProtectedRoute>} />
        <Route path="/host/properties/new"       element={<ProtectedRoute roles={['host','admin']}><CreateProperty /></ProtectedRoute>} />
        {/* ✅ NEW: Edit property route */}
        <Route path="/host/properties/:id/edit"  element={<ProtectedRoute roles={['host','admin']}><EditProperty /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}