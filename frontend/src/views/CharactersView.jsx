import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Sparkles } from 'lucide-react'
import useCharacterStore from '@/stores/characterStore'
import CharacterCard from '@/components/CharacterCard'
import CharacterCreateDialog from '@/components/CharacterCreateDialog'

export default function CharactersView() {
  const navigate = useNavigate()
  const { characters, fetchCharacters, isLoading } = useCharacterStore()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all') // all, preset, custom

  useEffect(() => {
    fetchCharacters()
  }, [])

  const filtered = characters.filter((c) => {
    const matchSearch =
      c.name.includes(search) ||
      (c.personality || []).some((p) => p.includes(search)) ||
      (c.background || '').includes(search)
    const matchFilter =
      filter === 'all' ||
      (filter === 'preset' && c.is_preset) ||
      (filter === 'custom' && !c.is_preset)
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">角色库</h1>
          <p className="text-gray-400 mt-1">选择一个角色，开始你们的对话</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          创建角色
        </button>
      </div>

      {/* 搜索与筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索角色名称、性格、背景..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: '全部' },
            { value: 'preset', label: '预设' },
            { value: 'custom', label: '我的' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-white text-gray-500 hover:bg-warmth-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 角色网格 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-400">没有找到匹配的角色</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onClick={() => navigate(`/characters/${char.id}`)}
            />
          ))}
        </div>
      )}

      {/* 创建角色对话框 */}
      {showCreate && (
        <CharacterCreateDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            fetchCharacters()
          }}
        />
      )}
    </div>
  )
}
