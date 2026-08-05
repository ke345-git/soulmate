import { create } from 'zustand'
import api from '@/lib/api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('soulmate_user') || 'null'),
  token: localStorage.getItem('soulmate_token') || null,
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
      localStorage.setItem('soulmate_token', data.access_token)
      localStorage.setItem('soulmate_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, isLoading: false })
      return true
    } catch (err) {
      const msg = err.response?.data?.detail || '登录失败'
      set({ error: msg, isLoading: false })
      return false
    }
  },

  async register(email, username, password) {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', { email, username, password })
      localStorage.setItem('soulmate_token', data.access_token)
      localStorage.setItem('soulmate_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, isLoading: false })
      return true
    } catch (err) {
      const msg = err.response?.data?.detail || '注册失败'
      set({ error: msg, isLoading: false })
      return false
    }
  },

  logout() {
    localStorage.removeItem('soulmate_token')
    localStorage.removeItem('soulmate_user')
    set({ user: null, token: null })
  },

  async updateProfile(updates) {
    try {
      const { data } = await api.put('/auth/me', updates)
      localStorage.setItem('soulmate_user', JSON.stringify(data.user))
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
      localStorage.setItem('soulmate_user', JSON.stringify(data.user))
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
