import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, XCircle, Zap, Globe, Cpu, Sparkles } from 'lucide-react'
import useModelStore from '@/stores/modelStore'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const PROVIDER_ICONS = {
  openai: '🤖',
  anthropic: '🧠',
  azure: '☁️',
  custom: '🔧',
}

const PROVIDER_DEFAULTS = {
  openai: { base_url: 'https://api.openai.com/v1', model: 'gpt-4o' },
  anthropic: { base_url: 'https://api.anthropic.com/v1', model: 'claude-sonnet-5' },
  azure: { base_url: 'https://YOUR_RESOURCE.openai.azure.com', model: 'gpt-4' },
  custom: { base_url: 'https://api.openai.com/v1', model: 'gpt-4o' },
}

export default function ModelConfigView() {
  const { models, activeModel, isLoading, fetchModels, createModel, updateModel, deleteModel, testModel } =
    useModelStore()

  const [showForm, setShowForm] = useState(false)
  const [editingModel, setEditingModel] = useState(null)
  const [testingId, setTestingId] = useState(null)
  const [testResults, setTestResults] = useState({})  // { [modelId]: {success, message} }
  const [presets, setPresets] = useState([])  // 公益站/免费接口预设
  const [showPresets, setShowPresets] = useState(false)

  const [form, setForm] = useState({
    name: '',
    provider: 'openai',
    api_key: '',
    base_url: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    is_active: false,
    max_tokens: 4096,
    temperature: 0.7,
  })

  useEffect(() => {
    fetchModels()
    // 拉取公益站/免费接口预设
    api.get('/models/presets')
      .then((res) => setPresets(res.data.presets || []))
      .catch(() => {})
  }, [])

  const resetForm = () => {
    setForm({
      name: '',
      provider: 'openai',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      is_active: false,
      max_tokens: 4096,
      temperature: 0.7,
    })
    setEditingModel(null)
    setShowForm(false)
  }

  const handleProviderChange = (provider) => {
    const defaults = PROVIDER_DEFAULTS[provider]
    setForm((prev) => ({
      ...prev,
      provider,
      base_url: defaults.base_url,
      model: defaults.model,
    }))
  }

  const handleEdit = (model) => {
    setEditingModel(model)
    setForm({
      name: model.name,
      provider: model.provider,
      api_key: '',
      base_url: model.base_url,
      model: model.model,
      is_active: model.is_active,
      max_tokens: model.max_tokens,
      temperature: model.temperature,
    })
    setShowForm(true)
    setTestResults({})
  }

  /** 一键填充公益站/免费接口预设 */
  const handleUsePreset = (preset) => {
    setEditingModel(null)
    setForm({
      name: preset.name,
      provider: preset.provider,
      api_key: '',
      base_url: preset.base_url,
      model: preset.model,
      is_active: false,
      max_tokens: 4096,
      temperature: 0.7,
    })
    setShowForm(true)
    setShowPresets(false)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.model) return

    if (editingModel) {
      await updateModel(editingModel.id, form)
    } else {
      await createModel(form)
    }
    resetForm()
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除此模型配置？')) return
    await deleteModel(id)
  }

  const handleTest = async (model) => {
    setTestingId(model.id)
    const result = await testModel(model.provider, '', model.base_url, model.model)
    setTestResults((prev) => ({ ...prev, [model.id]: result }))
    setTestingId(null)
    // 更新模型在线状态
    if (result.success) {
      await updateModel(model.id, { last_test_result: 'online' })
    } else {
      await updateModel(model.id, { last_test_result: 'offline' })
    }
  }

  const handleActivate = async (model) => {
    await updateModel(model.id, { is_active: true })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">模型配置</h1>
          <p className="text-gray-400 mt-1">配置你的 AI 模型 API</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          添加模型
        </button>
      </div>

      {/* 公益站 / 免费接口预设 */}
      {presets.length > 0 && (
        <div className="glass rounded-2xl mb-6 overflow-hidden">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-warmth-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-700 text-sm">公益站 / 免费接口预设</h3>
                <p className="text-xs text-gray-400">
                  一键填充常用服务商（含免费额度，政策以官网为准），填入 Key 即可使用
                </p>
              </div>
            </div>
            <span className={cn('text-gray-300 transition-transform', showPresets && 'rotate-180')}>▼</span>
          </button>

          {showPresets && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border-t border-warmth-100">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleUsePreset(p)}
                  className="text-left p-3 rounded-xl border border-warmth-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    {p.is_free && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">免费</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{p.description}</p>
                  <p className="text-[11px] text-gray-300 mt-1 font-mono truncate">{p.base_url}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 模型列表 */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-rose-400 rounded-full typing-dot" />
          </div>
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl">
          <p className="text-5xl mb-4">🔌</p>
          <h3 className="text-lg font-medium text-gray-600 mb-2">还没有配置任何模型</h3>
          <p className="text-gray-400 mb-6">添加你的第一个 AI 模型，开始对话之旅</p>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium"
          >
            添加模型
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {models.map((model) => (
            <div
              key={model.id}
              className={cn(
                'glass rounded-2xl p-5 transition-all hover:shadow-md',
                model.is_active && 'ring-2 ring-rose-300'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{PROVIDER_ICONS[model.provider] || '🤖'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-700">{model.name}</h3>
                    <p className="text-xs text-gray-400">{model.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {model.is_active && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full font-medium">
                      使用中
                    </span>
                  )}
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full font-medium',
                      model.last_test_result === 'online'
                        ? 'bg-green-50 text-green-600'
                        : model.last_test_result === 'offline'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-50 text-gray-400'
                    )}
                  >
                    {model.last_test_result === 'online'
                      ? '在线'
                      : model.last_test_result === 'offline'
                      ? '离线'
                      : '未知'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span>提供商: {model.provider}</span>
                <span>最大 Token: {model.max_tokens}</span>
                <span>温度: {model.temperature}</span>
              </div>

              <div className="flex gap-2">
                {!model.is_active && (
                  <button
                    onClick={() => handleActivate(model)}
                    className="flex-1 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
                  >
                    激活使用
                  </button>
                )}
                <button
                  onClick={() => handleEdit(model)}
                  className="flex-1 py-2 bg-warmth-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-warmth-200 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleTest(model)}
                  disabled={testingId === model.id}
                  className="flex-1 py-2 bg-warmth-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-warmth-200 transition-colors disabled:opacity-50"
                >
                  {testingId === model.id ? '测试中...' : '测试'}
                </button>
                <button
                  onClick={() => handleDelete(model.id)}
                  className="py-2 px-3 bg-warmth-100 text-gray-400 hover:text-red-500 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {testResults[model.id] && (
                <div
                  className={cn(
                    'mt-3 p-2 rounded-lg text-xs',
                    testResults[model.id].success
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-500'
                  )}
                >
                  {testResults[model.id].success ? '✅ ' : '❌ '}
                  {testResults[model.id].message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => resetForm()}>
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-700 mb-6">
              {editingModel ? '编辑模型' : '添加新模型'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">显示名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：我的 GPT-4"
                  className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">提供商</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PROVIDER_ICONS).map(([key, icon]) => (
                    <button
                      key={key}
                      onClick={() => handleProviderChange(key)}
                      className={cn(
                        'p-3 rounded-xl text-center text-sm transition-all',
                        form.provider === key
                          ? 'bg-rose-100 border-rose-300 border'
                          : 'bg-warmth-50 border border-transparent hover:bg-warmth-100'
                      )}
                    >
                      <span className="text-xl">{icon}</span>
                      <p className="text-xs mt-1 capitalize">{key}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">API Key</label>
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  placeholder={editingModel ? '留空不修改' : 'sk-...'}
                  className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">API 地址</label>
                <input
                  type="text"
                  value={form.base_url}
                  onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">模型 ID</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="例如：gpt-4o"
                  className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">最大 Token</label>
                  <input
                    type="number"
                    value={form.max_tokens}
                    onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 4096 })}
                    className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">温度 (0-2)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0.7 })}
                    className="w-full px-4 py-2.5 bg-warmth-50 border border-warmth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetForm} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-400 to-warmth-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                {editingModel ? '保存修改' : '添加模型'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
