import { useState, useEffect } from 'react'
import { X, Plus, Minus, Image as ImageIcon } from 'lucide-react'
import useCharacterStore from '@/stores/characterStore'
import { cn } from '@/lib/utils'
import { resolveAssetUrl } from '@/lib/api'

const EMOJI_OPTIONS = ['😊', '🌸', '✨', '🌟', '🦇', '🔬', '❄️', '🐱', '🏹', '👑', '🤖', '🖤', '💉', '🎀', '🎭', '📚', '💝', '🌙']

export default function CharacterCreateDialog({ initial = null, onClose, onCreated }) {
  const { createCharacter, updateCharacter } = useCharacterStore()
  const [loading, setLoading] = useState(false)
  const [portraits, setPortraits] = useState([])  // 内置免费立绘
  const [showPortraitPicker, setShowPortraitPicker] = useState(false)

  const [form, setForm] = useState({
    name: '',
    avatar: '😊',
    avatar_image: '',
    system_prompt: '',
    personality: [],
    background: '',
    style: '',
    greeting: '你好呀~',
    example_dialogues: [],
    source_type: 'custom',
    source_text: '',
  })
  const [newTag, setNewTag] = useState('')
  const [newDialogue, setNewDialogue] = useState({ user: '', bot: '' })

  // 编辑模式：填充初始数据
  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        avatar: initial.avatar || '😊',
        avatar_image: initial.avatar_image || '',
        system_prompt: initial.system_prompt || '',
        personality: initial.personality || [],
        background: initial.background || '',
        style: initial.style || '',
        greeting: initial.greeting || '你好呀~',
        example_dialogues: initial.example_dialogues || [],
        source_type: initial.source_type || 'custom',
        source_text: initial.source_text || '',
      })
    }
  }, [initial])

  // 拉取内置立绘清单
  useEffect(() => {
    fetch(resolveAssetUrl('/portraits/manifest.json'))
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setPortraits(Array.isArray(list) ? list : []))
      .catch(() => setPortraits([]))
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.system_prompt) {
      alert('请至少填写角色名称和系统提示词')
      return
    }
    setLoading(true)
    const payload = { ...form, example_dialogues: form.example_dialogues.filter((d) => d.user || d.bot) }
    const char = initial
      ? await updateCharacter(initial.id, payload)
      : await createCharacter(payload)
    setLoading(false)
    if (char) {
      onCreated?.(char)
      onClose?.()
    }
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

  const addDialogue = () => {
    if (!newDialogue.user && !newDialogue.bot) return
    setForm({
      ...form,
      example_dialogues: [...form.example_dialogues, { user: newDialogue.user, bot: newDialogue.bot }],
    })
    setNewDialogue({ user: '', bot: '' })
  }

  const updateDialogue = (idx, field, value) => {
    const list = form.example_dialogues.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    setForm({ ...form, example_dialogues: list })
  }

  const removeDialogue = (idx) => {
    setForm({ ...form, example_dialogues: form.example_dialogues.filter((_, i) => i !== idx) })
  }

  const pickPortrait = (path) => {
    setForm({ ...form, avatar_image: path, avatar: '🎴' })
    setShowPortraitPicker(false)
  }

  const pickEmoji = (emoji) => {
    setForm({ ...form, avatar: emoji })
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-700">
            {initial ? '编辑角色' : '创建角色'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 立绘选择 */}
          <div className="rounded-2xl bg-warmth-50 p-4">
            <label className="block text-sm text-gray-500 mb-2">立绘 / 头像</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center text-4xl flex-shrink-0">
                {form.avatar_image ? (
                  <img src={resolveAssetUrl(form.avatar_image)} alt="立绘" className="w-full h-full object-cover" />
                ) : (
                  form.avatar || '😊'
                )}
              </div>
              <div className="flex-1 space-y-2">
                <button
                  onClick={() => setShowPortraitPicker(!showPortraitPicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-warmth-200 rounded-xl text-sm text-gray-600 hover:border-rose-300 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-rose-400" />
                  {showPortraitPicker ? '收起立绘库' : '从内置立绘库选择'}
                </button>
                <div className="flex flex-wrap gap-1">
                  {EMOJI_OPTIONS.slice(0, 10).map((e) => (
                    <button
                      key={e}
                      onClick={() => pickEmoji(e)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors',
                        !form.avatar_image && form.avatar === e
                          ? 'bg-rose-100 ring-2 ring-rose-300'
                          : 'bg-white hover:bg-warmth-100'
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {showPortraitPicker && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">
                  内置免费立绘（本地生成，无版权问题）。更想要专属立绘？创建后可在角色详情页用 AI 生成。
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {portraits.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pickPortrait(p.path)}
                      className={cn(
                        'rounded-xl overflow-hidden border-2 transition-all hover:scale-105',
                        form.avatar_image === p.path ? 'border-rose-400' : 'border-transparent'
                      )}
                      title={p.name}
                    >
                      <img src={resolveAssetUrl(p.path)} alt={p.name} className="w-full aspect-square object-cover" />
                      <span className="block text-center text-[10px] text-gray-400 py-0.5 bg-white">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">角色背景</label>
              <textarea
                value={form.background}
                onChange={(e) => setForm({ ...form, background: e.target.value })}
                placeholder="角色的年龄、职业、经历..."
                rows={3}
                className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">语言风格</label>
              <textarea
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                placeholder="说话的语气、句式、口头禅..."
                rows={3}
                className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          {/* 示例对话 */}
          <div className="rounded-2xl bg-warmth-50 p-4">
            <label className="block text-sm text-gray-500 mb-2">示例对话（让 AI 更贴近角色语气）</label>
            <div className="space-y-2">
              {form.example_dialogues.map((d, i) => (
                <div key={i} className="flex items-start gap-2 bg-white rounded-xl p-2.5">
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={d.user}
                      onChange={(e) => updateDialogue(i, 'user', e.target.value)}
                      placeholder="对方说..."
                      className="w-full px-3 py-1.5 bg-warmth-50 border border-warmth-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                    <input
                      type="text"
                      value={d.bot}
                      onChange={(e) => updateDialogue(i, 'bot', e.target.value)}
                      placeholder="角色回答..."
                      className="w-full px-3 py-1.5 bg-rose-50/60 border border-rose-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <button
                    onClick={() => removeDialogue(i)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-2">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={newDialogue.user}
                  onChange={(e) => setNewDialogue({ ...newDialogue, user: e.target.value })}
                  placeholder="对方说..."
                  className="w-full px-3 py-1.5 bg-white border border-warmth-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <input
                  type="text"
                  value={newDialogue.bot}
                  onChange={(e) => setNewDialogue({ ...newDialogue, bot: e.target.value })}
                  placeholder="角色回答..."
                  className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <button
                onClick={addDialogue}
                className="p-2 bg-rose-100 text-rose-500 rounded-lg hover:bg-rose-200 transition-colors mt-auto"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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
            {loading ? '保存中...' : initial ? '保存修改' : '创建角色'}
          </button>
        </div>
      </div>
    </div>
  )
}
