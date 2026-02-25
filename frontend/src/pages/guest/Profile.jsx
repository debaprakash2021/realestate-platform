import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, Shield, Camera } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser }  = useAuth()
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [loading, setLoading] = useState(false)
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', form)
      updateUser(res.data.data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally { setLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setPwLoading(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    } finally { setPwLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Profile</h1>

      {/* Avatar */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img src={user?.avatar?.url || 'https://via.placeholder.com/80'} alt={user?.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow">
              <Camera size={13} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Mail size={14} /> {user?.email}
            </div>
            <div className="flex items-center gap-1.5 text-sm mt-1">
              <Shield size={14} className="text-rose-500" />
              <span className="capitalize text-gray-600">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2"><User size={18} className="text-rose-500" /> Personal Info</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" className="input-field" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" placeholder="+91 XXXXXX XXXX" className="input-field" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field bg-gray-50" value={user?.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2"><Shield size={18} className="text-rose-500" /> Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" className="input-field" value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" className="input-field" value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" className="input-field" value={pwForm.confirmPassword}
              onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}