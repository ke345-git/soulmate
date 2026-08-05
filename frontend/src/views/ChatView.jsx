import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Send, Plus, Trash2, Brain, PanelRightClose, PanelRight, Sparkles } from 'lucide-react'
import useChatStore from '@/stores/chatStore'
import useCharacterStore from '@/stores/characterStore'
import useModelStore from '@/stores/modelStore'
import ChatBubble from '@/components/ChatBubble'
import MemoryPanel from '@/components/MemoryPanel'
import ModelSelector from '@/components/ModelSelector'
import CharacterSelector from '@/components/CharacterSelector'
import { cn } from '@/lib/utils'

export default function ChatView() {
  const { sessionId } = useParams()
  const {
    sessions,
    currentSession,
    messages,
    isStreaming,
    isLoading,
    fetchSessions,
    createSession,
    selectSession,
    sendMessage,
    deleteSession,
  } = useChatStore()
  const { characters, fetchCharacters } = useCharacterStore()
  const { activeModel, fetchModels } = useModelStore()

  const [input, setInput] = useState('')
  const [selectedCharId, setSelectedCharId] = useState(null)
  const [showMemory, setShowMemory] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchSessions()
    fetchCharacters()
    fetchModels()
  }, [])

  useEffect(() => {
    if (sessionId) {
      selectSession(sessionId)
    }
  }, [sessionId])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 当前角色
  const currentCharacter = characters.find((c) => c.id === selectedCharId)

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isStreaming) return
    if (!selectedCharId) {
      alert('请先选择一个角色')
      return
    }

    setInput('')

    let sid = currentSession?.id
    if (!sid) {
      const session = await createSession(selectedCharId)
      if (!session) return
      sid = session.id
    }

    await sendMessage(content, selectedCharId, sid, activeModel?.id)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = async () => {
    if (!selectedCharId) {
      alert('请先选择一个角色')
      return
    }
    await createSession(selectedCharId)
  }

  // 欢迎页面
  if (!currentSession && !sessionId && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-lg animate-fade-in">
          <div className="text-6xl mb-6">💝</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-3">开始你的 SoulMate 之旅</h2>
          <p className="text-gray-400 mb-8">选择一个角色，开启属于你们的对话</p>

          <div className="mb-8">
            <CharacterSelector
              characters={characters}
              selectedId={selectedCharId}
              onSelect={(id) => {
                setSelectedCharId(id)
                createSession(id)
              }}
            />
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-medium text-gray-600 mb-4">快速开始</h3>
            <div className="grid grid-cols-2 gap-3">
              {characters.slice(0, 6).map((char) => (
                <button
                  key={char.id}
                  onClick={() => {
                    setSelectedCharId(char.id)
                    createSession(char.id)
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-warmth-100 transition-colors text-left"
                >
                  <span className="text-2xl">{char.avatar}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{char.name}</p>
                    <p className="text-xs text-gray-400">
                      {char.personality?.[0] || '温柔'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* 会话列表（桌面端） */}
      <div className="hidden lg:flex flex-col w-64 border-r border-warmth-200 bg-white/50">
        <div className="p-4 border-b border-warmth-200">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            新对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => selectSession(session.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group',
                currentSession?.id === session.id
                  ? 'bg-rose-50 border border-rose-200'
                  : 'hover:bg-warmth-100 border border-transparent'
              )}
            >
              <span className="text-xl">{session.character_avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{session.title}</p>
                <p className="text-xs text-gray-400 truncate">{session.character_name}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('确定删除此对话？')) deleteSession(session.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>

        {/* 用户设置快捷入口 */}
      </div>

      {/* 聊天区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-3 border-b border-warmth-200 glass">
          <div className="flex items-center gap-3">
            <CharacterSelector
              characters={characters}
              selectedId={selectedCharId}
              onSelect={(id) => {
                setSelectedCharId(id)
                createSession(id)
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <ModelSelector />
            <button
              onClick={() => setShowMemory(!showMemory)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showMemory ? 'bg-rose-100 text-rose-500' : 'hover:bg-warmth-100 text-gray-400'
              )}
              title="记忆面板"
            >
              <Brain className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && currentCharacter && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">{currentCharacter.avatar}</div>
              <h3 className="text-lg font-medium text-gray-600">{currentCharacter.name}</h3>
              <p className="text-gray-400 mt-1">{currentCharacter.greeting || '开始聊天吧~'}</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} characterAvatar={currentCharacter?.avatar} />
          ))}

          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-center gap-1 px-4 py-3">
              <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="p-4 border-t border-warmth-200 glass">
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentCharacter ? `和 ${currentCharacter.name} 说点什么...` : '输入消息...'}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-white border border-warmth-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
                style={{ maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl hover:shadow-md transition-all disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>

      {/* 记忆面板（右侧） */}
      {showMemory && currentSession && (
        <div className="hidden lg:block w-72 border-l border-warmth-200">
          <MemoryPanel sessionId={currentSession.id} onClose={() => setShowMemory(false)} />
        </div>
      )}
    </div>
  )
}
