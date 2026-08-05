import { useState } from 'react'
import { User, Key, Shield, Save } from 'lucide-react'
import useAuthStore from '@/stores/authStore'

export default function SettingsView() {
  const { user, updateProfile } = useAuthStore()

  const [profile, setProfile] = useState({
    username: user?.username || '',
    avatar: user?.avatar || '👤',
    openai_api_key: '',
    anthropic_api_key: '',
    custom_api_key: '',
    custom_base_url: '',
    default_model: user?.default_model || 'gpt-4o',
  })
  const [saved, setSaved] = useState(false)

  const handleSaveProfile = async () => {
    await updateProfile({
      username: profile.username,
      avatar: profile.avatar,
      default_model: profile.default_model,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveKeys = async () => {
    const updates = {}
    if (profile.openai_api_key) updates.openai_api_key = profile.openai_api_key
    if (profile.anthropic_api_key) updates.anthropic_api_key = profile.anthropic_api_key
    if (profile.custom_api_key) updates.custom_api_key = profile.custom_api_key
    if (profile.custom_base_url) updates.custom_base_url = profile.custom_base_url

    await updateProfile(updates)
    setProfile((p) => ({
      ...p,
      openai_api_key: '',
      anthropic_api_key: '',
      custom_api_key: '',
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
          你可以在此设置默认的 API Key，在模型配置中也可单独为每个模型设置。留空则不修改。
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={profile.openai_api_key}
              onChange={(e) => setProfile({ ...profile, openai_api_key: e.target.value })}
              placeholder="sk-...（留空不修改）"
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Anthropic API Key</label>
            <input
              type="password"
              value={profile.anthropic_api_key}
              onChange={(e) => setProfile({ ...profile, anthropic_api_key: e.target.value })}
              placeholder="sk-ant-...（留空不修改）"
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">自定义 API Key</label>
            <input
              type="password"
              value={profile.custom_api_key}
              onChange={(e) => setProfile({ ...profile, custom_api_key: e.target.value })}
              placeholder="（留空不修改）"
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
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">
              GitHub 仓库
            </a>
          </p>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-green-500 text-white rounded-xl text-sm shadow-lg animate-slide-up">
          保存成功 ✓
        </div>
      )}
    </div>
  )
}
