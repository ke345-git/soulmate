import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Heart, Eye, EyeOff, Mail, Lock, Server, ChevronDown, Loader2, CheckCircle, XCircle } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { getApiBase, setApiBase } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function LoginView() {
  const { login, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showServer, setShowServer] = useState(false)
  const [serverUrl, setServerUrl] = useState(getApiBase() === '/api' ? '' : getApiBase())
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    clearError()
    await login(email, password)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const url = (serverUrl || '').trim().replace(/\/+$/, '')
    try {
      const healthUrl = url
        ? `${url.replace(/\/api$/, '')}/api/health`
        : '/api/health'
      const res = await fetch(healthUrl, { method: 'GET' })
      setTestResult(res.ok ? { ok: true, msg: '连接正常 ✓' } : { ok: false, msg: `服务器响应异常 (HTTP ${res.status})` })
    } catch {
      setTestResult({ ok: false, msg: '无法连接，请检查地址与网络' })
    }
    setTesting(false)
  }

  const handleSave = () => {
    setApiBase(serverUrl)
    // 保存后立即重载，让所有请求使用新地址
    window.location.reload()
  }

  return (
    <div className="min-h-screen gradient-warmth flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-warmth-500 shadow-lg shadow-rose-200 mb-4">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">SoulMate</h1>
          <p className="text-gray-400 mt-2">你的 AI 情感伴侣，随时倾听</p>
        </div>

        {/* 登录卡片 */}
        <div className="glass-strong rounded-3xl p-8 animate-slide-up">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">欢迎回来</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-rose-400 to-warmth-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-50"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            还没有账号？{' '}
            <RouterLink to="/register" className="text-rose-500 hover:text-rose-600 font-medium">
              立即注册
            </RouterLink>
          </p>

          {/* 服务器设置（手机/平板端连接电脑版必须） */}
          <div className="mt-6 pt-4 border-t border-warmth-100">
            <button
              onClick={() => setShowServer(!showServer)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Server className="w-3.5 h-3.5" />
              连接不上？配置服务器地址
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showServer && 'rotate-180')} />
            </button>

            {showServer && (
              <div className="mt-3 space-y-2 animate-fade-in">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => { setServerUrl(e.target.value); setTestResult(null) }}
                  placeholder="http://192.168.1.100:8000/api（留空 = 默认同源）"
                  className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin inline" /> : '测试连接'}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
                  >
                    保存并重载
                  </button>
                </div>
                {testResult && (
                  <p className={cn('flex items-center gap-1.5 text-xs', testResult.ok ? 'text-green-600' : 'text-red-500')}>
                    {testResult.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {testResult.msg}
                  </p>
                )}
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  在运行 SoulMate 的电脑上执行 <code className="px-1 bg-warmth-50 rounded">ipconfig</code> 查看局域网 IP（如 192.168.1.100），手机与电脑需在同一网络。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
