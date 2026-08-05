import { useState, useEffect } from 'react'
import { User, Key, Shield, Save, CheckCircle, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '@/stores/authStore'

export default function SettingsView() {
  const { user, updateProfile } = useAuthStore()

  const [profile, setProfile] = useState({
    username: user?.username || '',
    avatar: user?.avatar || '👤',
    openai_api_key: '',
    anthropic_api_key: '',
    custom_api_key: '',
    custom_base_url: user?.custom_base_url || '',
    default_model: user?.default_model || 'gpt-4o',
  })
  const [saved, setSaved] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [showKeys, setShowKeys] = useState({})

  // 从 user 对象读取已配置状态
  const hasKey = (type) => {
    if (type === 'openai') return user?.has_openai_key
    if (type === 'anthropic') return user?.has_anthropic_key
    if (type === 'custom') return user?.has_custom_key
    return false
  }

  const handleSaveProfile = async () => {
    await updateProfile({
      username: profile.username,
      avatar: profile.avatar,
      default_model: profile.default_model,
    })
    setSavedMsg('个人资料已保存')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSaveKeys = async () => {
    const updates = {}
    if (profile.openai_api_key) updates.openai_api_key = profile.openai_api_key
    if (profile.anthropic_api_key) updates.anthropic_api_key = profile.anthropic_api_key
    if (profile.custom_api_key) updates.custom_api_key = profile.custom_api_key
    if (profile.custom_base_url) updates.custom_base_url = profile.custom_base_url

    if (Object.keys(updates).length === 0) {
      setSavedMsg('没有需要保存的修改')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      return
    }

    await updateProfile(updates)
    // 不清空输入框，保留用户输入
    setSavedMsg('API Keys 已保存 ✓')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleShowKey = (key) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">设置</h1>

      {/* 个人资料 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <User className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">个人资料</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">用户名</label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">头像 Emoji</label>
            <input
              type="text"
              value={profile.avatar}
              onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-warmth-100 flex items-center justify-center">
            <Key className="w-5 h-5 text-warmth-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">API Keys</h2>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          配置你的 AI 模型 API 密钥。密钥加密存储在服务器上，不会明文显示。
        </p>

        <div className="space-y-4">
          {/* OpenAI */}
          <div>
            <label className="flex items-center justify-between text-sm text-gray-500 mb-1">
              <span>OpenAI API Key</span>
              {hasKey('openai') && (
                <span className="flex items-center gap-1 text-green-500 text-xs">
                  <CheckCircle className="w-3 h-3" /> 已配置
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys['openai'] ? 'text' : 'password'}
                value={profile.openai_api_key}
                onChange={(e) => setProfile({ ...profile, openai_api_key: e.target.value })}
                placeholder={hasKey('openai') ? '已配置 (输入新Key覆盖)' : 'sk-...'}
                className="w-full pl-4 pr-10 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('openai')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                {showKeys['openai'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Anthropic */}
          <div>
            <label className="flex items-center justify-between text-sm text-gray-500 mb-1">
              <span>Anthropic API Key</span>
              {hasKey('anthropic') && (
                <span className="flex items-center gap-1 text-green-500 text-xs">
                  <CheckCircle className="w-3 h-3" /> 已配置
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys['anthropic'] ? 'text' : 'password'}
                value={profile.anthropic_api_key}
                onChange={(e) => setProfile({ ...profile, anthropic_api_key: e.target.value })}
                placeholder={hasKey('anthropic') ? '已配置 (输入新Key覆盖)' : 'sk-ant-...'}
                className="w-full pl-4 pr-10 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('anthropic')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                {showKeys['anthropic'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Custom */}
          <div>
            <label className="flex items-center justify-between text-sm text-gray-500 mb-1">
              <span>自定义 API Key</span>
              {hasKey('custom') && (
                <span className="flex items-center gap-1 text-green-500 text-xs">
                  <CheckCircle className="w-3 h-3" /> 已配置
                </span>
              )}
            </label>
            <input
              type="password"
              value={profile.custom_api_key}
              onChange={(e) => setProfile({ ...profile, custom_api_key: e.target.value })}
              placeholder={hasKey('custom') ? '已配置 (输入新Key覆盖)' : '自定义API密钥'}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">自定义 API 地址</label>
            <input
              type="text"
              value={profile.custom_base_url}
              onChange={(e) => setProfile({ ...profile, custom_base_url: e.target.value })}
              placeholder="https://your-api.com/v1"
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <button
            onClick={handleSaveKeys}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            保存 API Keys
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
          <p>版本：1.0.0</p>
          <p>技术栈：FastAPI + React + SQLite</p>
          <p>开源协议：MIT</p>
          <p>
            <a href="https://github.com/ke345-git/soulmate" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">
              GitHub 仓库
            </a>
          </p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 px-5 py-3 bg-green-500 text-white rounded-xl text-sm shadow-lg animate-slide-up flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {savedMsg}
        </div>
      )}
    </div>
  )
}
