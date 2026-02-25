import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, Shield, Camera, Phone, FileText } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser }  = useAuth()
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' })
  const [loading, setLoading] = useState(false)
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading]     = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileRef = useRef()

  // ✅ FIXED: was /auth/profile → correct endpoint is /auth/update-profile
  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put('/auth/update-profile', form)
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

  // ✅ NEW: Avatar upload functionality
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setAvatarLoading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      updateUser({ avatar: res.data.data.avatar })
      toast.success('Avatar updated! 🎉')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setAvatarLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Profile</h1>

      {/* Avatar Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img
              src={user?.avatar?.url || 'https://via.placeholder.com/80'}
              alt={user?.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow hover:bg-rose-600 transition-colors disabled:opacity-50"
              title="Change avatar"
            >
              {avatarLoading
                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={13} className="text-white" />
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Mail size={14} /> {user?.email}
            </div>
            <div className="flex items-center gap-1.5 text-sm mt-1">
              <Shield size={14} className="text-rose-500" />
              <span className="capitalize bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-xs font-medium">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
          <User size={18} className="text-rose-500" /> Personal Info
        </h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" className="input-field" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Phone size={13} /> Phone
            </label>
            <input type="tel" placeholder="+91 XXXXXX XXXX" className="input-field" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText size={13} /> Bio
            </label>
            <textarea rows={3} placeholder="Tell guests or hosts about yourself..." className="input-field resize-none"
              value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field bg-gray-50 cursor-not-allowed" value={user?.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
          <Shield size={18} className="text-rose-500" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" className="input-field" value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" placeholder="Min 6 characters" className="input-field" value={pwForm.newPassword}
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