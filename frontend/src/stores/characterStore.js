import { create } from 'zustand'
import api from '@/lib/api'

const useCharacterStore = create((set, get) => ({
  characters: [],
  currentCharacter: null,
  isLoading: false,
  error: null,

  async fetchCharacters() {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/characters')
      set({ characters: data.characters, isLoading: false })
    } catch (err) {
      set({ error: '加载角色失败', isLoading: false })
    }
  },

  async fetchCharacter(id) {
    try {
      const { data } = await api.get(`/characters/${id}`)
      set({ currentCharacter: data.character })
      return data.character
    } catch (err) {
      set({ error: '加载角色详情失败' })
      return null
    }
  },

  async createCharacter(charData) {
    try {
      const { data } = await api.post('/characters', charData)
      set((state) => ({ characters: [...state.characters, data.character] }))
      return data.character
    } catch (err) {
      set({ error: '创建角色失败' })
      return null
    }
  },

  async updateCharacter(id, updates) {
    try {
      const { data } = await api.put(`/characters/${id}`, updates)
      set((state) => ({
        characters: state.characters.map((c) => (c.id === id ? data.character : c)),
        currentCharacter: state.currentCharacter?.id === id ? data.character : state.currentCharacter,
      }))
      return data.character
    } catch (err) {
      set({ error: '更新角色失败' })
      return null
    }
  },

  async deleteCharacter(id) {
    try {
      await api.delete(`/characters/${id}`)
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter,
      }))
    } catch (err) {
      set({ error: '删除角色失败' })
    }
  },

  setCurrentCharacter(character) {
    set({ currentCharacter: character })
  },

  clearError() {
    set({ error: null })
  },
}))

export default useCharacterStore
