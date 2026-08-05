import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import useCharacterStore from '@/stores/characterStore'

export default function CharacterCreateDialog({ onClose, onCreated }) {
  const { createCharacter } = useCharacterStore()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    avatar: '😊',
    system_prompt: '',
    personality: [],
    background: '',
    style: '',
    greeting: '你好呀~',
  })
  const [newTag, setNewTag] = useState('')

  const handleSubmit = async () => {
    if (!form.name || !form.system_prompt) {
      alert('请至少填写角色名称和系统提示词')
      return
    }
    setLoading(true)
    const char = await createCharacter(form)
    if (char) {
      onCreated?.()
    }
    setLoading(false)
  }

  const addTag = () => {
    const tag = newTag.trim()
    if (tag && !form.personality.includes(tag)) {
      setForm({ ...form, personality: [...form.personality, tag] })
    }
    setNewTag('')
  }

  const removeTag = (tag) => {
    setForm({ ...form, personality: form.personality.filter((t) => t !== tag) })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-700">创建角色</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">角色名称 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="给角色起个名字"
                className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm text-gray-500 mb-1">头像</label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className="w-full px-3 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">开场白</label>
            <input
              type="text"
              value={form.greeting}
              onChange={(e) => setForm({ ...form, greeting: e.target.value })}
              placeholder="角色第一次见面说什么？"
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">系统提示词 *</label>
            <textarea
              value={form.system_prompt}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              placeholder="描述角色的身份、性格、说话方式..."
              rows={4}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">性格标签</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="输入标签后按回车"
                className="flex-1 px-4 py-2 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <button
                onClick={addTag}
                className="p-2 bg-rose-100 text-rose-500 rounded-xl hover:bg-rose-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.personality.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 text-xs rounded-full"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <Minus className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">角色背景</label>
            <textarea
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
              placeholder="角色的年龄、职业、经历..."
              rows={2}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">语言风格</label>
            <textarea
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              placeholder="说话的语气、句式、口头禅..."
              rows={2}
              className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? '创建中...' : '创建角色'}
          </button>
        </div>
      </div>
    </div>
  )
}
