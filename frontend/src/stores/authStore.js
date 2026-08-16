import { create } from 'zustand'
import api from '@/lib/api'

/** 安全读取本地用户信息：任何异常都不能阻止应用启动（否则白屏） */
function loadStoredUser() {
  try {
    const raw = localStorage.getItem('soulmate_user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && parsed.id ? parsed : null
  } catch {
    // 数据损坏时清掉，避免下次再崩
    try {
      localStorage.removeItem('soulmate_user')
    } catch {
      /* ignore */
    }
    return null
  }
}

function loadStoredToken() {
  try {
    return localStorage.getItem('soulmate_token') || null
  } catch {
    return null
  }
}

/** 安全写 localStorage（WebView 隐私模式等场景可能抛异常） */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

const useAuthStore = create((set, get) => ({
  user: loadStoredUser(),
  token: loadStoredToken(),
  isLoading: false,
  error: null,

  // 注意：Zustand 不支持 class getter 响应式更新
  // 使用时请用: useAuthStore(s => !!s.token && !!s.user)
  isAuthenticated() {
    return !!get().token && !!get().user
  },

  async login(email, password) {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      safeSet('soulmate_token', data.access_token)
      safeSet('soulmate_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, isLoading: false })
      return true
    } catch (err) {
      const msg = err.response?.data?.detail || '登录失败，请检查服务器地址与网络'
      set({ error: msg, isLoading: false })
      return false
    }
  },

  async register(email, username, password) {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', { email, username, password })
      safeSet('soulmate_token', data.access_token)
      safeSet('soulmate_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, isLoading: false })
      return true
    } catch (err) {
      const msg = err.response?.data?.detail || '注册失败，请检查服务器地址与网络'
      set({ error: msg, isLoading: false })
      return false
    }
  },

  logout() {
    safeRemove('soulmate_token')
    safeRemove('soulmate_user')
    set({ user: null, token: null })
  },

  async updateProfile(updates) {
    try {
      const { data } = await api.put('/auth/me', updates)
      safeSet('soulmate_user', JSON.stringify(data.user))
      set({ user: data.user })
      return data.user
    } catch (err) {
      const msg = err.response?.data?.detail || '更新失败'
      set({ error: msg })
      throw new Error(msg)
    }
  },

  async fetchUser() {
    try {
      const { data } = await api.get('/auth/me')
      safeSet('soulmate_user', JSON.stringify(data.user))
      set({ user: data.user })
      return data.user
    } catch (err) {
      // token 过期则登出
      if (err.response?.status === 401) {
        get().logout()
      }
      return null
    }
  },

  clearError() {
    set({ error: null })
  },
}))

export default useAuthStore
