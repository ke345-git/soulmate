import { create } from 'zustand'
import api from '@/lib/api'

const useModelStore = create((set, get) => ({
  models: [],
  activeModel: null,
  isLoading: false,
  error: null,

  async fetchModels() {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/models')
      set({
        models: data.models,
        activeModel: data.models.find((m) => m.is_active) || data.models[0] || null,
        isLoading: false,
      })
    } catch (err) {
      set({ error: '加载模型配置失败', isLoading: false })
    }
  },

  async createModel(modelData) {
    try {
      const { data } = await api.post('/models', modelData)
      set((state) => ({
        models: [...state.models, data.model],
        activeModel: data.model.is_active ? data.model : state.activeModel,
      }))
      return data.model
    } catch (err) {
      set({ error: '创建模型失败' })
      return null
    }
  },

  async updateModel(id, updates) {
    try {
      const { data } = await api.put(`/models/${id}`, updates)
      set((state) => ({
        models: state.models.map((m) => (m.id === id ? data.model : m)),
        activeModel: data.model.is_active ? data.model : state.activeModel,
      }))
      return data.model
    } catch (err) {
      set({ error: '更新模型失败' })
      return null
    }
  },

  async deleteModel(id) {
    try {
      await api.delete(`/models/${id}`)
      set((state) => ({
        models: state.models.filter((m) => m.id !== id),
        activeModel: state.activeModel?.id === id ? null : state.activeModel,
      }))
    } catch (err) {
      set({ error: '删除模型失败' })
    }
  },

  async testModel(provider, apiKey, baseUrl, model) {
    try {
      const { data } = await api.post('/models/test', {
        provider,
        api_key: apiKey,
        base_url: baseUrl,
        model,
      })
      return data
    } catch (err) {
      return { success: false, message: err.response?.data?.detail || '测试失败' }
    }
  },

  setActiveModel(model) {
    set({ activeModel: model })
  },

  clearError() {
    set({ error: null })
  },
}))

export default useModelStore
