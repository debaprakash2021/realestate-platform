import { useState, useEffect } from 'react'
import { Users, Search, ChevronDown, Shield, User, Home, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const ROLE_CONFIG = {
  guest: { cls: 'bg-blue-100 text-blue-700',   icon: <User size={11} />,   label: 'Guest'  },
  host:  { cls: 'bg-green-100 text-green-700',  icon: <Home size={11} />,   label: 'Host'   },
  admin: { cls: 'bg-purple-100 text-purple-700', icon: <Shield size={11} />, label: 'Admin'  },
}

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function UserRow({ user, onUpdate }) {
  const [updating, setUpdating] = useState(false)
  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.guest

  const changeRole = async (newRole) => {
    if (newRole === user.role) return
    setUpdating(true)
    try {
      await api.put(`/admin/users/${user._id}`, { role: newRole })
      toast.success(`Role changed to ${newRole}`)
      onUpdate(user._id, { role: newRole })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally { setUpdating(false) }
  }

  const toggleActive = async () => {
    setUpdating(true)
    try {
      await api.put(`/admin/users/${user._id}`, { isActive: !user.isActive })
      toast.success(user.isActive ? 'User deactivated' : 'User reactivated')
      onUpdate(user._id, { isActive: !user.isActive })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally { setUpdating(false) }
  }

  return (
    <div className={`border rounded-xl p-4 transition-colors ${user.isActive ? 'border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'border-red-100 bg-red-50/30'}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">

        {/* Avatar + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <img
              src={user.avatar?.url || 'https://via.placeholder.com/44'}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover"
            />
            {!user.isActive && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            {user.phone && <p className="text-xs text-gray-400 dark:text-gray-500">📞 {user.phone}</p>}
            <p className="text-xs text-gray-300 dark:text-gray-600 font-mono mt-0.5">ID: {user._id}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-4 shrink-0">
          <div className="text-center">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{user.stats?.totalBookings || 0}</p>
            <p className="text-gray-400 dark:text-gray-500">Bookings</p>
          </div>
          {user.role === 'host' && (
            <div className="text-center">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{user.hostInfo?.totalListings || 0}</p>
              <p className="text-gray-400 dark:text-gray-500">Listings</p>
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{fmt(user.createdAt)}</p>
            <p className="text-gray-400 dark:text-gray-500">Joined</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Role select */}
          <div className="relative">
            <select
              value={user.role}
              onChange={e => changeRole(e.target.value)}
              disabled={updating}
              className={`text-xs font-medium pl-2 pr-6 py-1.5 rounded-full border-0 appearance-none cursor-pointer ${role.cls} disabled:opacity-60`}
            >
              <option value="guest">Guest</option>
              <option value="host">Host</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDown size={11} className="absolute right-1.5 top-2 pointer-events-none opacity-60" />
          </div>

          {/* Active toggle */}
          <button
            onClick={toggleActive}
            disabled={updating}
            title={user.isActive ? 'Deactivate user' : 'Reactivate user'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              user.isActive
                ? 'text-green-500 hover:bg-green-50'
                : 'text-red-500 hover:bg-red-50'
            }`}
          >
            {updating
              ? <RefreshCw size={16} className="animate-spin" />
              : user.isActive
                ? <CheckCircle size={16} />
                : <XCircle size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const LIMIT = 20

  const fetchUsers = async (s = search, r = roleFilter, p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: LIMIT, page: p })
      if (s) params.append('search', s)
      if (r !== 'all') params.append('role', r)
      const res = await api.get(`/admin/users?${params}`)
      setUsers(res.data.data?.users || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch {
      toast.error('Failed to load users')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers(search, roleFilter, 1)
  }

  const handleRoleFilter = (r) => {
    setRoleFilter(r)
    setPage(1)
    fetchUsers(search, r, 1)
  }

  const handleUpdate = (userId, changes) => {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...changes } : u))
  }

  const roleTabs = ['all', 'guest', 'host', 'admin']

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={24} className="text-rose-500" /> Manage Users
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} total users</p>
        </div>
        <button onClick={() => fetchUsers()} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto">
        {roleTabs.map(r => (
          <button
            key={r}
            onClick={() => handleRoleFilter(r)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              roleFilter === r
                ? 'bg-rose-500 text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-rose-300'
            }`}
          >
            {r === 'all' ? 'All Users' : r + 's'}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <button type="submit" className="btn-primary px-5 text-sm">Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setPage(1); fetchUsers('', roleFilter, 1) }}
            className="btn-secondary text-sm px-4">Clear</button>
        )}
      </form>

      {/* Users List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-20" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-gray-400 dark:text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <UserRow key={u._id} user={u} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => { setPage(p => p - 1); fetchUsers(search, roleFilter, page - 1) }}
              disabled={page === 1} className="btn-secondary text-sm px-4 disabled:opacity-40">← Previous</button>
            <button onClick={() => { setPage(p => p + 1); fetchUsers(search, roleFilter, page + 1) }}
              disabled={page * LIMIT >= total} className="btn-secondary text-sm px-4 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}