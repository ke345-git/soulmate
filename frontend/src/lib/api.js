import axios from 'axios'

/** localStorage 中保存的 API 服务器地址键 */
export const STORAGE_KEY_API_BASE = 'soulmate_api_base'

/**
 * 获取当前 API 基础地址。
 * - 浏览器（前后端同源部署）：默认 '/api'
 * - APK / 移动端：用户在「服务器设置」中填写的绝对地址，如 http://192.168.1.100:8000/api
 */
export function getApiBase() {
  try {
    const saved = (localStorage.getItem(STORAGE_KEY_API_BASE) || '').trim().replace(/\/+$/, '')
    return saved || '/api'
  } catch {
    return '/api'
  }
}

/** 保存 API 服务器地址（空值恢复默认 '/api'） */
export function setApiBase(url) {
  try {
    const v = (url || '').trim().replace(/\/+$/, '')
    if (v) {
      localStorage.setItem(STORAGE_KEY_API_BASE, v)
    } else {
      localStorage.removeItem(STORAGE_KEY_API_BASE)
    }
  } catch {
    // 存储不可用时静默失败
  }
}

/**
 * 把后端返回的相对资源路径（如 /portraits/x.svg）解析为可访问的完整地址。
 * 浏览器同源时原样返回；APK 中自动拼接服务器地址。
 */
export function resolveAssetUrl(path) {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  // 从 API 地址推导资源根（去掉 /api 后缀）
  const base = getApiBase().replace(/\/api$/, '') || ''
  return base + path
}

const api = axios.create({
  baseURL: getApiBase(),
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器 — 每次请求时动态读取服务器地址（支持运行时切换）+ 自动附加 JWT Token
api.interceptors.request.use((config) => {
  config.baseURL = getApiBase()
  const token = localStorage.getItem('soulmate_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 — 处理 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('soulmate_token')
      localStorage.removeItem('soulmate_user')
      // 用 reload 而不是跳转：兼容 Capacitor WebView（相对路径跳转可能导致白屏）
      if (!window.location.pathname.startsWith('/login')) {
        window.location.reload()
      }
    }
    return Promise.reject(error)
  }
)

export default api
