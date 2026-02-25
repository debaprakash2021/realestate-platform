import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Home, Heart, Calendar, MessageCircle, User, LogOut, PlusSquare, BarChart2, Menu, X, Building, ShieldCheck, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import NotificationsPanel from '../common/NotificationsPanel'

export default function Navbar() {
  const { user, logout }        = useAuth()
  const navigate                = useNavigate()
  const location                = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false) }
  const active = (path) => location.pathname === path
    ? 'text-rose-500 bg-rose-50'
    : 'text-gray-600 hover:text-rose-500 hover:bg-rose-50'

  const linkCls = (path) => `flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${active(path)}`

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <Home size={17} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">RealEstate</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <Link to="/login"    className="btn-secondary text-sm">Log in</Link>
                <Link to="/register" className="btn-primary text-sm ml-2">Sign up</Link>
              </>
            ) : (
              <>
                {/* ─── GUEST LINKS ─────────────────────────── */}
                {user.role === 'guest' && (
                  <>
                    <Link to="/dashboard"   className={linkCls('/dashboard')}><LayoutDashboard size={15} /> Dashboard</Link>
                    <Link to="/my-bookings" className={linkCls('/my-bookings')}><Calendar size={15} /> Bookings</Link>
                    <Link to="/favorites"   className={linkCls('/favorites')}><Heart size={15} /> Favorites</Link>
                    <Link to="/messages"    className={linkCls('/messages')}><MessageCircle size={15} /> Messages</Link>
                  </>
                )}

                {/* ─── HOST LINKS ──────────────────────────── */}
                {user.role === 'host' && (
                  <>
                    <Link to="/host/dashboard"      className={linkCls('/host/dashboard')}><BarChart2 size={15} /> Dashboard</Link>
                    <Link to="/host/properties"     className={linkCls('/host/properties')}><Building size={15} /> Properties</Link>
                    <Link to="/host/properties/new" className={linkCls('/host/properties/new')}><PlusSquare size={15} /> List</Link>
                    <Link to="/messages"            className={linkCls('/messages')}><MessageCircle size={15} /> Messages</Link>
                  </>
                )}

                {/* ─── ADMIN LINKS ─────────────────────────── */}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard"     className={linkCls('/admin/dashboard')}><ShieldCheck size={15} /> Admin</Link>
                    <Link to="/host/dashboard"      className={linkCls('/host/dashboard')}><BarChart2 size={15} /> Host View</Link>
                    <Link to="/host/properties/new" className={linkCls('/host/properties/new')}><PlusSquare size={15} /> List</Link>
                  </>
                )}

                {/* ─── COMMON ──────────────────────────────── */}
                <NotificationsPanel />
                <Link to="/profile" className={linkCls('/profile')}><User size={15} /> {user.name?.split(' ')[0]}</Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <LogOut size={15} />
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
                {user.role === 'guest' && (
                  <>
                    <Link to="/dashboard"   className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><LayoutDashboard size={15}/> Dashboard</Link>
                    <Link to="/my-bookings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><Calendar size={15}/> Bookings</Link>
                    <Link to="/favorites"   className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><Heart size={15}/> Favorites</Link>
                    <Link to="/messages"    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><MessageCircle size={15}/> Messages</Link>
                  </>
                )}
                {user.role === 'host' && (
                  <>
                    <Link to="/host/dashboard"      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><BarChart2 size={15}/> Dashboard</Link>
                    <Link to="/host/properties"     className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><Building size={15}/> Properties</Link>
                    <Link to="/host/properties/new" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><PlusSquare size={15}/> List Property</Link>
                    <Link to="/messages"            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><MessageCircle size={15}/> Messages</Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard"     className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><ShieldCheck size={15}/> Admin Panel</Link>
                    <Link to="/host/dashboard"      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><BarChart2 size={15}/> Host View</Link>
                  </>
                )}
                <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(false)}><User size={15}/> Profile</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"><LogOut size={15}/> Logout</button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}