import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  Home, Heart, Calendar, MessageCircle, User, LogOut,
  PlusSquare, BarChart2, Menu, X, Building, ShieldCheck,
  LayoutDashboard, Users, BookOpen, AlertTriangle, Sun, Moon
} from 'lucide-react'
import { useState } from 'react'
import NotificationsPanel from '../common/NotificationsPanel'

// ─── Logout Confirmation Modal ─────────────────────────────────────────────
function LogoutModal({ user, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-[fadeInUp_0.2s_ease-out]">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
          <LogOut size={26} className="text-red-500" />
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">
          Leaving so soon? 👀
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-1">
          You're signed in as
        </p>
        <p className="text-center font-semibold text-gray-800 dark:text-gray-200 text-sm mb-5">
          {user?.name}
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500 capitalize bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {user?.role}
          </span>
        </p>

        {/* Warning note */}
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-6 text-left">
          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            You'll need to log in again to access your bookings, messages, and favorites.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:border-gray-600 transition-all"
          >
            Stay Logged In
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={15} /> Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Theme Toggle Button ───────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="relative w-[52px] h-7 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #312e81, #1e1b4b)'
          : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        boxShadow: isDark
          ? '0 0 12px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 0 12px rgba(251,191,36,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
      }}
    >
      {/* Sun emoji - visible in light mode */}
      <span
        className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] transition-opacity duration-200"
        style={{ opacity: isDark ? 0 : 1 }}
      >
        ☀️
      </span>

      {/* Moon emoji - visible in dark mode */}
      <span
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] transition-opacity duration-200"
        style={{ opacity: isDark ? 1 : 0 }}
      >
        🌙
      </span>

      {/* Sliding knob */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center transition-all duration-300"
        style={{
          left: isDark ? 'calc(100% - 26px)' : '2px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        }}
      >
        {isDark
          ? <Moon size={13} className="text-indigo-600" />
          : <Sun size={13} className="text-amber-500" />
        }
      </span>
    </button>
  )
}

// ─── Navbar ────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  const confirmLogout = () => {
    setShowLogout(false)
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const active = (path) => location.pathname === path
    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
    : 'text-gray-600 dark:text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'

  const linkCls = (path) =>
    `flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${active(path)}`

  const LogoutBtn = ({ mobile = false }) => (
    <button
      onClick={() => setShowLogout(true)}
      className={
        mobile
          ? 'flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg w-full transition-colors'
          : 'flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800'
      }
    >
      <LogOut size={15} />
      Logout
    </button>
  )

  const mLink = (to, icon, label) => (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
      onClick={() => setMenuOpen(false)}
    >
      {icon} {label}
    </Link>
  )

  return (
    <>
      <nav className="sticky top-0 z-50" style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(244,63,94,0.1)',
        boxShadow: '0 1px 24px rgba(0,0,0,0.07)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
                <Home size={17} className="text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">RealEstate</span>
            </Link>

            {/* ─── Desktop Nav ──────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-1">

              {/* Theme toggle always visible on desktop */}
              <div className="mr-2">
                <ThemeToggle />
              </div>

              {!user ? (
                <>
                  <Link to="/login" className="btn-secondary text-sm">Log in</Link>
                  <Link to="/register" className="btn-primary text-sm ml-2">Sign up</Link>
                </>
              ) : (
                <>
                  {/* GUEST */}
                  {user.role === 'guest' && (
                    <>
                      <Link to="/dashboard" className={linkCls('/dashboard')}><LayoutDashboard size={15} /> Dashboard</Link>
                      <Link to="/my-bookings" className={linkCls('/my-bookings')}><Calendar size={15} /> Bookings</Link>
                      <Link to="/favorites" className={linkCls('/favorites')}><Heart size={15} /> Favorites</Link>
                      <Link to="/messages" className={linkCls('/messages')}><MessageCircle size={15} /> Messages</Link>
                    </>
                  )}

                  {/* HOST */}
                  {user.role === 'host' && (
                    <>
                      <Link to="/host/dashboard" className={linkCls('/host/dashboard')}><BarChart2 size={15} /> Dashboard</Link>
                      <Link to="/host/bookings" className={linkCls('/host/bookings')}><Calendar size={15} /> Bookings</Link>
                      <Link to="/host/properties" className={linkCls('/host/properties')}><Building size={15} /> Properties</Link>
                      <Link to="/host/properties/new" className={linkCls('/host/properties/new')}><PlusSquare size={15} /> List</Link>
                      <Link to="/messages" className={linkCls('/messages')}><MessageCircle size={15} /> Messages</Link>
                    </>
                  )}

                  {/* ADMIN */}
                  {user.role === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" className={linkCls('/admin/dashboard')}><ShieldCheck size={15} /> Dashboard</Link>
                      <Link to="/admin/users" className={linkCls('/admin/users')}><Users size={15} /> Users</Link>
                      <Link to="/admin/properties" className={linkCls('/admin/properties')}><Building size={15} /> Properties</Link>
                      <Link to="/host/bookings" className={linkCls('/host/bookings')}><BookOpen size={15} /> Bookings</Link>
                      <Link to="/messages" className={linkCls('/messages')}><MessageCircle size={15} /> Messages</Link>
                    </>
                  )}

                  {/* COMMON */}
                  <NotificationsPanel />
                  <Link to="/profile" className={linkCls('/profile')}><User size={15} /> {user.name?.split(' ')[0]}</Link>
                  <LogoutBtn />
                </>
              )}
            </div>

            {/* ─── Mobile: theme toggle + hamburger ─────────────── */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* ─── Mobile Menu ──────────────────────────────────── */}
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-2">
              {!user ? (
                <div className="flex gap-2 px-2">
                  <Link to="/login" className="btn-secondary text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>Log in</Link>
                  <Link to="/register" className="btn-primary text-sm flex-1 text-center" onClick={() => setMenuOpen(false)}>Sign up</Link>
                </div>
              ) : (
                <>
                  {user.role === 'guest' && (
                    <>
                      {mLink('/dashboard', <LayoutDashboard size={15} />, 'Dashboard')}
                      {mLink('/my-bookings', <Calendar size={15} />, 'Bookings')}
                      {mLink('/favorites', <Heart size={15} />, 'Favorites')}
                      {mLink('/messages', <MessageCircle size={15} />, 'Messages')}
                    </>
                  )}
                  {user.role === 'host' && (
                    <>
                      {mLink('/host/dashboard', <BarChart2 size={15} />, 'Dashboard')}
                      {mLink('/host/bookings', <Calendar size={15} />, 'Bookings')}
                      {mLink('/host/properties', <Building size={15} />, 'Properties')}
                      {mLink('/host/properties/new', <PlusSquare size={15} />, 'List Property')}
                      {mLink('/messages', <MessageCircle size={15} />, 'Messages')}
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      {mLink('/admin/dashboard', <ShieldCheck size={15} />, 'Admin Dashboard')}
                      {mLink('/admin/users', <Users size={15} />, 'Manage Users')}
                      {mLink('/admin/properties', <Building size={15} />, 'Manage Properties')}
                      {mLink('/host/bookings', <BookOpen size={15} />, 'All Bookings')}
                      {mLink('/messages', <MessageCircle size={15} />, 'Messages')}
                    </>
                  )}
                  {mLink('/profile', <User size={15} />, 'Profile')}
                  <div className="px-2 pt-1">
                    <LogoutBtn mobile />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ─── Logout Confirmation Modal ──────────────────────────── */}
      {showLogout && (
        <LogoutModal
          user={user}
          onConfirm={confirmLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  )
}