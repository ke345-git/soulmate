import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Pencil, Trash2, Upload } from 'lucide-react'
import useCharacterStore from '@/stores/characterStore'
import useChatStore from '@/stores/chatStore'
import api from '@/lib/api'

export default function CharacterDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchCharacter, deleteCharacter } = useCharacterStore()
  const { createSession } = useChatStore()
  const [character, setCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarImage, setAvatarImage] = useState('')

  useEffect(() => {
    loadCharacter()
  }, [id])

  const loadCharacter = async () => {
    setLoading(true)
    const char = await fetchCharacter(id)
    if (char) {
      setCharacter(char)
      setAvatarImage(char.avatar_image || '')
    }
    setLoading(false)
  }

  const handleStartChat = async () => {
    const session = await createSession(id)
    if (session) {
      navigate(`/chat/${session.id}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个角色吗？此操作不可撤销。')) return
    await deleteCharacter(id)
    navigate('/characters')
  }

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过 5MB')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('soulmate_token')
      const res = await fetch(`/api/characters/${id}/upload-avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (res.ok) {
        await loadCharacter()
      }
    } catch (err) {
      alert('上传失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
          <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-4xl mb-4">😢</p>
        <p className="text-gray-400">角色不存在</p>
        <button onClick={() => navigate('/characters')} className="mt-4 text-rose-500 hover:underline">
          返回角色列表
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/characters')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回角色列表
      </button>

      <div className="glass-strong rounded-3xl overflow-hidden">
        {/* 角色头部 */}
        <div className="gradient-warmth p-8 flex flex-col sm:flex-row items-start gap-6">
          {/* 立绘 */}
          <div className="relative group">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={character.name}
                className="w-28 h-28 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-white/80 flex items-center justify-center text-5xl shadow-lg">
                {character.avatar || '😊'}
              </div>
            )}
            {!character.is_preset && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{character.name}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              {(character.personality || []).map((p) => (
                <span
                  key={p}
                  className="px-3 py-1 bg-white/70 backdrop-blur rounded-full text-sm text-rose-600 font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
            <p className="text-gray-500">{character.background}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStartChat}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              开始聊天
            </button>
            {!character.is_preset && (
              <>
                <button
                  onClick={handleDelete}
                  className="p-2.5 bg-white/70 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 角色详情 */}
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">语言风格</h3>
            <p className="text-gray-600 bg-warmth-50 rounded-xl p-4">{character.style || '暂无'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">角色设定</h3>
            <p className="text-gray-600 bg-warmth-50 rounded-xl p-4 whitespace-pre-wrap">
              {character.system_prompt || '暂无'}
            </p>
          </div>

          {character.greeting && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">开场白</h3>
              <div className="chat-bubble-assistant p-4 inline-block max-w-md">
                {character.greeting}
              </div>
            </div>
          )}

          {(character.example_dialogues || []).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">对话示例</h3>
              <div className="space-y-3">
                {character.example_dialogues.map((d, i) => (
                  <div key={i} className="space-y-2">
                    <div className="chat-bubble-user p-3 ml-auto max-w-[70%] w-fit">
                      {d.user}
                    </div>
                    <div className="chat-bubble-assistant p-3 max-w-[70%] w-fit">
                      {d.bot}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {character.is_preset && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="px-2 py-0.5 bg-warmth-100 rounded-full text-xs">系统预设</span>
              此角色由系统提供
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
