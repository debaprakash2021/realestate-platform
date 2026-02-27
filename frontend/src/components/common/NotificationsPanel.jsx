import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  booking_confirmed: '✅',
  booking_cancelled: '❌',
  booking_completed: '🎉',
  payment_received: '💰',
  review_received: '⭐',
  message_received: '💬',
  default: '🔔'
}

export default function NotificationsPanel() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef()

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch unread count on mount + poll every 30s for live badge updates
  useEffect(() => {
    if (!user) return
    const fetchCount = () =>
      api.get('/notifications/unread-count')
        .then(r => setUnread(r.data.data?.unreadCount || 0))
        .catch(() => { })
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  const loadNotifications = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await api.get('/notifications?limit=15')
      setNotifications(res.data.data?.notifications || [])
      setUnread(res.data.data?.unreadCount || 0)
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) loadNotifications()
  }

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch { }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnread(0)
      toast.success('All marked as read')
    } catch { }
  }

  const deleteNotif = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch { }
  }

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Notifications {unread > 0 && <span className="text-rose-500 ml-1">({unread} new)</span>}
            </h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-colors"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">We'll notify you about bookings, messages & more</p>
              </div>
            ) : notifications.map(n => (
              // FIX #6: Added 'group' class to this div.
              // The delete button uses opacity-0 group-hover:opacity-100, but without
              // the 'group' class on a parent, group-hover never triggers — button stays invisible forever.
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`group flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-rose-50/50' : ''}`}
              >
                <div className="text-xl shrink-0 mt-0.5">{TYPE_ICON[n.type] || TYPE_ICON.default}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-1" />
                  )}
                  <button
                    onClick={(e) => deleteNotif(n._id, e)}
                    className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}