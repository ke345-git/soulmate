import { useState, useEffect } from 'react'
import { User, Key, Shield, Save, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import useAuthStore from '@/stores/authStore'

export default function SettingsView() {
  const { user, updateProfile, fetchUser } = useAuthStore()

  const [profile, setProfile] = useState({ username: '', avatar: '👤', openai_api_key: '', anthropic_api_key: '', custom_api_key: '', custom_base_url: '', default_model: 'gpt-4o' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // {type: 'success'|'error', msg: ''}
  const [showKeys, setShowKeys] = useState({})

  // 页面加载时从服务器刷新最新用户数据
  useEffect(() => {
    const load = async () => {
      const u = await fetchUser()
      if (u) {
        setProfile((p) => ({
          ...p,
          username: u.username || '',
          avatar: u.avatar || '👤',
          custom_base_url: u.custom_base_url || '',
          default_model: u.default_model || 'gpt-4o',
        }))
      }
    }
    load()
  }, [])

  // 从 user 对象读取已配置状态
  const keyStatus = {
    openai: user?.has_openai_key || false,
    anthropic: user?.has_anthropic_key || false,
    custom: user?.has_custom_key || false,
  }

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ username: profile.username, avatar: profile.avatar, default_model: profile.default_model })
      showToast('success', '个人资料已保存')
    } catch (e) {
      showToast('error', e.message || '保存失败')
    }
    setSaving(false)
  }

  const handleSaveKeys = async () => {
    const updates = {}
    if (profile.openai_api_key) updates.openai_api_key = profile.openai_api_key
    if (profile.anthropic_api_key) updates.anthropic_api_key = profile.anthropic_api_key
    if (profile.custom_api_key) updates.custom_api_key = profile.custom_api_key
    if (profile.custom_base_url) updates.custom_base_url = profile.custom_base_url

    if (Object.keys(updates).length === 0) {
      showToast('error', '请输入需要保存的 API Key')
      return
    }

    setSaving(true)
    try {
      await updateProfile(updates)
      // 清空输入框（密钥已安全存储）
      setProfile((p) => ({ ...p, openai_api_key: '', anthropic_api_key: '', custom_api_key: '' }))
      showToast('success', 'API Key 已安全保存')
    } catch (e) {
      showToast('error', e.message || '保存失败')
    }
    setSaving(false)
  }

  const toggleShowKey = (key) => setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">设置</h1>

      {/* API Keys — 放在最上面，用户最先看到 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-warmth-100 flex items-center justify-center">
            <Key className="w-5 h-5 text-warmth-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700">API Keys</h2>
            <p className="text-xs text-gray-400">至少配置一个 Key 才能使用 AI 聊天</p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {/* OpenAI */}
          <div className={`p-4 rounded-xl border-2 transition-colors ${keyStatus.openai ? 'border-green-300 bg-green-50/50' : 'border-warmth-200 bg-warmth-50/30'}`}>
            <label className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-600">OpenAI API Key</span>
              {keyStatus.openai ? (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> 已配置</span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 text-xs"><XCircle className="w-3.5 h-3.5" /> 未配置</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys['openai'] ? 'text' : 'password'}
                value={profile.openai_api_key}
                onChange={(e) => setProfile({ ...profile, openai_api_key: e.target.value })}
                placeholder={keyStatus.openai ? '输入新 Key 以覆盖' : 'sk-proj-...'}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <button type="button" onClick={() => toggleShowKey('openai')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showKeys['openai'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Anthropic */}
          <div className={`p-4 rounded-xl border-2 transition-colors ${keyStatus.anthropic ? 'border-green-300 bg-green-50/50' : 'border-warmth-200 bg-warmth-50/30'}`}>
            <label className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-600">Anthropic API Key</span>
              {keyStatus.anthropic ? (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> 已配置</span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 text-xs"><XCircle className="w-3.5 h-3.5" /> 未配置</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys['anthropic'] ? 'text' : 'password'}
                value={profile.anthropic_api_key}
                onChange={(e) => setProfile({ ...profile, anthropic_api_key: e.target.value })}
                placeholder={keyStatus.anthropic ? '输入新 Key 以覆盖' : 'sk-ant-...'}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <button type="button" onClick={() => toggleShowKey('anthropic')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showKeys['anthropic'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Custom */}
          <div className={`p-4 rounded-xl border-2 transition-colors ${keyStatus.custom ? 'border-green-300 bg-green-50/50' : 'border-warmth-200 bg-warmth-50/30'}`}>
            <label className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-600">自定义 API</span>
              {keyStatus.custom ? (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> 已配置</span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400 text-xs"><XCircle className="w-3.5 h-3.5" /> 未配置</span>
              )}
            </label>
            <input type="password" value={profile.custom_api_key} onChange={(e) => setProfile({ ...profile, custom_api_key: e.target.value })}
              placeholder={keyStatus.custom ? '输入新 Key 以覆盖' : '自定义 API 密钥'}
              className="w-full px-4 py-2.5 bg-white border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 mb-2" />
            <input type="text" value={profile.custom_base_url} onChange={(e) => setProfile({ ...profile, custom_base_url: e.target.value })}
              placeholder="API 地址，如 https://api.openai.com/v1"
              className="w-full px-4 py-2.5 bg-white border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>

          <button onClick={handleSaveKeys} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存 API Keys
          </button>
        </div>
      </div>

      {/* 个人资料 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <User className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">个人资料</h2>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm text-gray-500 mb-1">用户名</label>
            <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <div><label className="block text-sm text-gray-500 mb-1">头像 Emoji</label>
            <input type="text" value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <button onClick={handleSaveProfile} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>

      {/* 关于 */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">关于 SoulMate</h2>
        </div>
        <div className="text-sm text-gray-400 space-y-1">
          <p>版本：1.1.0</p>
          <p>技术栈：FastAPI + React + SQLite</p>
          <p>开源协议：MIT</p>
          <p><a href="https://github.com/ke345-git/soulmate" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">GitHub 仓库</a></p>
        </div>
      </div>

      {/* Toast 通知 */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm shadow-lg animate-slide-up flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
