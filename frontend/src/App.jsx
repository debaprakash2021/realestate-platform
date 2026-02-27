import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/shared/Home'
import PropertyDetail from './pages/shared/PropertyDetail'
import PaymentPage from './pages/shared/PaymentPage'
import GuestDashboard from './pages/guest/GuestDashboard'
import MyBookings from './pages/guest/MyBookings'
import Favorites from './pages/guest/Favorites'
import Messages from './pages/guest/Messages'
import Profile from './pages/guest/Profile'
import HostDashboard from './pages/host/HostDashboard'
import HostBookings from './pages/host/HostBookings'
import MyProperties from './pages/host/MyProperties'
import CreateProperty from './pages/host/CreateProperty'
import EditProperty from './pages/host/EditProperty'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminProperties from './pages/Admin/AdminProperties'

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400 dark:text-gray-500 dark:bg-gray-950">
      Loading...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><GuestDashboard /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/payment/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/host/dashboard" element={<ProtectedRoute roles={['host', 'admin']}><HostDashboard /></ProtectedRoute>} />
        <Route path="/host/bookings" element={<ProtectedRoute roles={['host', 'admin']}><HostBookings /></ProtectedRoute>} />
        <Route path="/host/properties" element={<ProtectedRoute roles={['host', 'admin']}><MyProperties /></ProtectedRoute>} />
        <Route path="/host/properties/new" element={<ProtectedRoute roles={['host', 'admin']}><CreateProperty /></ProtectedRoute>} />
        <Route path="/host/properties/:id/edit" element={<ProtectedRoute roles={['host', 'admin']}><EditProperty /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/properties" element={<ProtectedRoute roles={['admin']}><AdminProperties /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}