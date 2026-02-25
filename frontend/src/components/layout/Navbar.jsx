import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Home, Heart, Calendar, MessageCircle, User, LogOut, PlusSquare, BarChart2, Menu, X, Building } from 'lucide-react'
import { useState } from 'react'
import NotificationsPanel from '../common/NotificationsPanel'

export default function Navbar() {
  const { user, logout }        = useAuth()
  const navigate                = useNavigate()
  const location                = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
  const isActive = (path) =>
    location.pathname === path
      ? 'text-rose-500 bg-rose-50'
      : 'text-gray-600 hover:text-rose-500 hover:bg-rose-50'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">StayEase</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <Link to="/login"    className="btn-secondary text-sm">Log in</Link>
                <Link to="/register" className="btn-primary text-sm ml-2">Sign up</Link>
              </>
            ) : (
              <>
                <Link to="/my-bookings" className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${isActive('/my-bookings')}`}>
                  <Calendar size={16} /> Bookings
                </Link>
                <Link to="/favorites" className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${isActive('/favorites')}`}>
                  <Heart size={16} /> Favorites
                </Link>
                <Link to="/messages" className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${isActive('/messages')}`}>
                  <MessageCircle size={16} /> Messages
                </Link>

                {(user.role === 'host' || user.role === 'admin') && (
                  <>
                    <Link to="/host/dashboard" className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${isActive('/host/dashboard')}`}>
                      <BarChart2 size={16} /> Dashboard
                    </Link>
                    <Link to="/host/properties" className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${isActive('/host/properties')}`}>
                      <Building size={16} /> Properties
                    </Link>
                    <Link to="/host/properties/new" className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${isActive('/host/properties/new')}`}>
                      <PlusSquare size={16} /> List
                    </Link>
                  </>
                )}

                {/* 🔔 Notifications Bell */}
                <NotificationsPanel />

                <Link to="/profile" className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${isActive('/profile')}`}>
                  <User size={16} /> {user.name?.split(' ')[0]}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 pt-2">
            {!user ? (
              <div className="flex gap-2 px-2">
                <Link to="/login"    className="btn-secondary text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link to="/register" className="btn-primary text-sm flex-1 text-center"   onClick={() => setMenuOpen(false)}>Sign up</Link>
              </div>
            ) : (
              <>
                <Link to="/my-bookings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><Calendar size={16}/> Bookings</Link>
                <Link to="/favorites"   className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><Heart size={16}/> Favorites</Link>
                <Link to="/messages"    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><MessageCircle size={16}/> Messages</Link>
                {(user.role === 'host' || user.role === 'admin') && (
                  <>
                    <Link to="/host/dashboard"      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><BarChart2 size={16}/> Dashboard</Link>
                    <Link to="/host/properties"     className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><Building size={16}/> My Properties</Link>
                    <Link to="/host/properties/new" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><PlusSquare size={16}/> List Property</Link>
                  </>
                )}
                <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><User size={16}/> Profile</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"><LogOut size={16}/> Logout</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}