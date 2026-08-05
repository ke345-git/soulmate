import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Brain, Star } from 'lucide-react'
import useChatStore from '@/stores/chatStore'
import { cn } from '@/lib/utils'

export default function MemoryPanel({ sessionId, onClose }) {
  const { memories, fetchMemories, addMemory, deleteMemory } = useChatStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newText, setNewText] = useState('')
  const [importance, setImportance] = useState(5)

  useEffect(() => {
    if (sessionId) fetchMemories(sessionId)
  }, [sessionId])

  const handleAdd = async () => {
    if (!newText.trim()) return
    await addMemory(sessionId, newText.trim(), 'manual', importance)
    setNewText('')
    setImportance(5)
    setShowAdd(false)
  }

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between p-4 border-b border-warmth-200">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-rose-400" />
          <h3 className="font-medium text-gray-700">记忆</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400 transition-colors"
            title="添加记忆"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 添加记忆表单 */}
      {showAdd && (
        <div className="p-3 border-b border-warmth-100">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="添加重要信息到记忆..."
            rows={2}
            className="w-full px-3 py-2 bg-warmth-50 border border-warmth-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 mb-2"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">重要度:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setImportance(n)}
                className={cn(
                  'w-5 h-5 rounded text-xs flex items-center justify-center transition-colors',
                  n <= importance
                    ? 'bg-rose-100 text-rose-500'
                    : 'bg-gray-50 text-gray-300'
                )}
              >
                <Star className="w-3 h-3" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-1.5 bg-rose-100 text-rose-600 rounded-lg text-xs font-medium"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 记忆列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Brain className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-xs text-gray-300">暂无记忆</p>
            <p className="text-xs text-gray-300 mt-1">
              对话中的重要信息会自动记录
            </p>
          </div>
        ) : (
          memories.map((mem) => (
            <div
              key={mem.id}
              className="group glass rounded-xl p-3 text-xs relative"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-gray-600 leading-relaxed">{mem.text}</p>
                <button
                  onClick={() => deleteMemory(mem.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    mem.memory_type === 'manual'
                      ? 'bg-blue-50 text-blue-500'
                      : mem.memory_type === 'important'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-gray-50 text-gray-400'
                  )}
                >
                  {mem.memory_type === 'manual' ? '手动' : mem.memory_type === 'important' ? '重要' : '自动'}
                </span>
                <div className="flex items-center gap-0.5">
                  {[...Array(mem.importance)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
