import { useState } from 'react'
import { X, Wand2, MessageSquareText, BookOpenText, Loader2, Check, RefreshCw } from 'lucide-react'
import api, { resolveAssetUrl } from '@/lib/api'
import useCharacterStore from '@/stores/characterStore'
import { cn } from '@/lib/utils'

/**
 * 角色导入向导：从聊天记录 / 小说文本自动提取角色
 */
export default function CharacterImportDialog({ onClose, onCreated }) {
  const { createCharacter } = useCharacterStore()
  const [mode, setMode] = useState('chatlog')  // chatlog | novel
  const [text, setText] = useState('')
  const [name, setName] = useState('')         // 角色名（可选）
  const [userLabel, setUserLabel] = useState('') // 聊天记录中"你"的称呼
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)   // { draft, candidates }
  const [creating, setCreating] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const handleAnalyze = async () => {
    if (text.trim().length < 20) {
      setError('请至少粘贴 20 字以上的内容')
      return
    }
    setAnalyzing(true)
    setError('')
    setResult(null)
    try {
      const path = mode === 'chatlog' ? '/characters/import-chatlog' : '/characters/import-novel'
      const payload =
        mode === 'chatlog'
          ? { text: text.trim(), name: name.trim() || null, user_label: userLabel.trim() || null }
          : { text: text.trim(), character_name: name.trim() || null }
      const { data } = await api.post(path, payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || '分析失败，请检查文本格式')
    }
    setAnalyzing(false)
  }

  const handleCreate = async () => {
    if (!result?.draft) return
    setCreating(true)
    const char = await createCharacter(result.draft)
    setCreating(false)
    if (char) {
      onCreated?.(char)
      onClose?.()
    }
  }

  const handlePickName = (n) => {
    setName(n)
    handleAnalyzeWith(n)
  }

  const handleAnalyzeWith = async (overrideName) => {
    setAnalyzing(true)
    setError('')
    try {
      const path = mode === 'chatlog' ? '/characters/import-chatlog' : '/characters/import-novel'
      const payload =
        mode === 'chatlog'
          ? { text: text.trim(), name: overrideName || name.trim() || null, user_label: userLabel.trim() || null }
          : { text: text.trim(), character_name: overrideName || name.trim() || null }
      const { data } = await api.post(path, payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || '分析失败')
    }
    setAnalyzing(false)
  }

  const draft = result?.draft

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-700">从文本导入角色</h2>
            <p className="text-xs text-gray-400 mt-1">粘贴聊天记录或小说内容，自动提取性格与人设</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 模式切换 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => { setMode('chatlog'); setResult(null); setError('') }}
            className={cn(
              'flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all',
              mode === 'chatlog'
                ? 'bg-gradient-to-r from-rose-100 to-warmth-100 text-rose-600 shadow-sm'
                : 'bg-warmth-50 text-gray-500 hover:bg-warmth-100'
            )}
          >
            <MessageSquareText className="w-4 h-4" />
            聊天记录
          </button>
          <button
            onClick={() => { setMode('novel'); setResult(null); setError('') }}
            className={cn(
              'flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all',
              mode === 'novel'
                ? 'bg-gradient-to-r from-rose-100 to-warmth-100 text-rose-600 shadow-sm'
                : 'bg-warmth-50 text-gray-500 hover:bg-warmth-100'
            )}
          >
            <BookOpenText className="w-4 h-4" />
            小说人物
          </button>
        </div>

        {mode === 'chatlog' ? (
          <div className="text-xs text-gray-400 mb-2 leading-relaxed">
            支持「名字：内容」格式，一行一句。例如：
            <code className="block mt-1 px-2 py-1.5 bg-warmth-50 rounded-lg text-gray-500">
              小美：在吗？<br />阿哲：在呢，怎么啦
            </code>
            系统会自动识别哪一方是你、哪一方是要扮演的角色（台词较少的一方视为你）。
          </div>
        ) : (
          <div className="text-xs text-gray-400 mb-2 leading-relaxed">
            粘贴小说正文或梗概（建议包含对话）。系统会用正则+关键词提取高频说话人、台词风格与性格标签，无需调用 AI。
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === 'chatlog' ? '粘贴聊天记录，每行一条「名字：内容」...' : '粘贴小说内容或梗概（30 字以上）...'}
          rows={8}
          className="w-full px-4 py-3 bg-warmth-50 border border-warmth-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 mb-3"
        />

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              {mode === 'chatlog' ? '角色名（可选）' : '角色名（可选，留空自动识别）'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'chatlog' ? '如：阿哲' : '如：林晚晚'}
              className="w-full px-4 py-2 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          {mode === 'chatlog' && (
            <div>
              <label className="block text-sm text-gray-500 mb-1">你在对话中的称呼（可选）</label>
              <input
                type="text"
                value={userLabel}
                onChange={(e) => setUserLabel(e.target.value)}
                placeholder="如：小美"
                className="w-full px-4 py-2 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* 分析结果预览 */}
        {draft && (
          <div className="rounded-2xl bg-warmth-50 p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center text-2xl shadow-sm">
                  {draft.avatar_image ? (
                    <img src={resolveAssetUrl(draft.avatar_image)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    draft.avatar || '✨'
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-700">{draft.name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(draft.personality || []).map((p) => (
                      <span key={p} className="px-1.5 py-0.5 bg-rose-50 text-rose-500 text-xs rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAnalyze()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warmth-200 rounded-lg text-xs text-gray-500 hover:border-rose-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                重新分析
              </button>
            </div>

            {/* 候选角色名 */}
            {mode === 'novel' && result.candidates?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">检测到候选角色：</span>
                {result.candidates.map((c) => (
                  <button
                    key={c}
                    onClick={() => handlePickName(c)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-full transition-colors',
                      draft.name === c
                        ? 'bg-rose-100 text-rose-600 font-medium'
                        : 'bg-white text-gray-500 hover:bg-rose-50'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 mb-1">说话风格</p>
              <p className="text-sm text-gray-600 bg-white rounded-lg p-2.5">{draft.style || '暂无'}</p>
            </div>

            {(draft.example_dialogues || []).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">示例对话（{draft.example_dialogues.length} 条）</p>
                <div className="space-y-1.5">
                  {draft.example_dialogues.slice(0, 4).map((d, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="chat-bubble-user p-2 ml-auto max-w-[80%] w-fit">{d.user}</div>
                      <div className="chat-bubble-assistant p-2 max-w-[80%] w-fit">{d.bot}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="text-xs text-rose-500 hover:underline"
            >
              {showPrompt ? '收起系统提示词' : '查看生成的系统提示词'}
            </button>
            {showPrompt && (
              <pre className="text-xs text-gray-500 bg-white rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {draft.system_prompt}
              </pre>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          {draft ? (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 创建中...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> 创建角色</span>
              )}
            </button>
          ) : (
            <button
              onClick={handleAnalyze}
              disabled={analyzing || text.trim().length < 20}
              className="flex-1 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> 分析中...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Wand2 className="w-4 h-4" /> 开始分析</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
