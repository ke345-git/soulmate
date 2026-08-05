import { create } from 'zustand'
import api from '@/lib/api'

const useChatStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  memories: [],
  isStreaming: false,
  isLoading: false,
  error: null,

  async fetchSessions() {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/chat/sessions')
      set({ sessions: data.sessions, isLoading: false })
    } catch (err) {
      set({ error: '加载会话失败', isLoading: false })
    }
  },

  async createSession(characterId) {
    try {
      const { data } = await api.post(`/chat/sessions?character_id=${characterId}`)
      set((state) => ({
        sessions: [data.session, ...state.sessions],
        currentSession: data.session,
        messages: [],
      }))
      return data.session
    } catch (err) {
      set({ error: '创建会话失败' })
      return null
    }
  },

  async selectSession(sessionId) {
    set({ isLoading: true })
    try {
      const { data } = await api.get(`/chat/sessions/${sessionId}/messages`)
      set({
        currentSession: data.session,
        messages: data.messages,
        isLoading: false,
      })
    } catch (err) {
      set({ error: '加载消息失败', isLoading: false })
    }
  },

  async sendMessage(content, characterId, sessionId, modelId = null) {
    const { isStreaming } = get()
    if (isStreaming) return

    set({ isStreaming: true, error: null })

    // 添加用户消息到界面
    const userMsg = { id: `temp-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() }
    set((state) => ({ messages: [...state.messages, userMsg] }))

    // 添加一个空的 AI 消息占位
    const assistantMsg = { id: `temp-ai-${Date.now()}`, role: 'assistant', content: '', created_at: new Date().toISOString() }
    set((state) => ({ messages: [...state.messages, assistantMsg] }))

    try {
      const token = localStorage.getItem('soulmate_token')
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          character_id: characterId,
          content,
          model_id: modelId,
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let newSessionId = sessionId
      let messageId = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk') {
                fullContent += data.content
                set((state) => {
                  const msgs = [...state.messages]
                  const lastMsg = msgs[msgs.length - 1]
                  if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id.startsWith('temp-ai-')) {
                    msgs[msgs.length - 1] = { ...lastMsg, content: fullContent }
                  }
                  return { messages: msgs }
                })
              } else if (data.type === 'done') {
                newSessionId = data.session_id
                messageId = data.message_id
              } else if (data.type === 'error') {
                set({ error: data.message })
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 更新消息 ID
      if (messageId) {
        set((state) => {
          const msgs = [...state.messages]
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            msgs[msgs.length - 1] = { ...lastMsg, id: messageId }
          }
          return { messages: msgs }
        })
      }

      // 更新 session
      if (newSessionId && newSessionId !== sessionId) {
        set((state) => ({
          currentSession: { ...state.currentSession, id: newSessionId },
        }))
        get().fetchSessions()
      }

      set({ isStreaming: false })
      return { sessionId: newSessionId }
    } catch (err) {
      set({ isStreaming: false, error: '发送消息失败: ' + err.message })
      return null
    }
  },

  async deleteSession(sessionId) {
    try {
      await api.delete(`/chat/sessions/${sessionId}`)
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
        messages: state.currentSession?.id === sessionId ? [] : state.messages,
      }))
    } catch (err) {
      set({ error: '删除会话失败' })
    }
  },

  async fetchMemories(sessionId) {
    try {
      const { data } = await api.get(`/chat/sessions/${sessionId}/memories`)
      set({ memories: data.memories })
    } catch (err) {
      console.error('加载记忆失败:', err)
    }
  },

  async addMemory(sessionId, text, memoryType = 'manual', importance = 5) {
    try {
      const { data } = await api.post('/chat/memories', {
        session_id: sessionId,
        text,
        memory_type: memoryType,
        importance,
      })
      set((state) => ({ memories: [...state.memories, data.memory] }))
      return data.memory
    } catch (err) {
      set({ error: '添加记忆失败' })
      return null
    }
  },

  async deleteMemory(memoryId) {
    try {
      await api.delete(`/chat/memories/${memoryId}`)
      set((state) => ({ memories: state.memories.filter((m) => m.id !== memoryId) }))
    } catch (err) {
      set({ error: '删除记忆失败' })
    }
  },

  clearError() {
    set({ error: null })
  },
}))

export default useChatStore
