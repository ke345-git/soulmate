import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Heart, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import useAuthStore from '@/stores/authStore'

export default function RegisterView() {
  const { register, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    if (!form.email || !form.username || !form.password) return
    if (form.password.length < 6) {
      setLocalError('密码至少需要6位')
      return
    }
    if (form.password !== form.confirmPassword) {
      setLocalError('两次输入的密码不一致')
      return
    }

    await register(form.email, form.username, form.password)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen gradient-warmth flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-warmth-500 shadow-lg shadow-rose-200 mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">加入 SoulMate</h1>
          <p className="text-gray-400 mt-2">找到属于你的 AI 伴侣</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">创建账号</h2>

          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder="给自己起个名字"
                  className="w-full pl-10 pr-4 py-3 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1.5">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full pl-10 pr-4 py-3 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="至少6位密码"
                  className="w-full pl-10 pr-12 py-3 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1.5">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full pl-10 pr-4 py-3 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-rose-400 to-warmth-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-50"
            >
              {isLoading ? '注册中...' : '创建账号'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            已有账号？{' '}
            <RouterLink to="/login" className="text-rose-500 hover:text-rose-600 font-medium">
              立即登录
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  )
}
