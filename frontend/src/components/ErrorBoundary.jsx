import React from 'react'

/**
 * 全局错误边界：任何未捕获的渲染/生命周期异常都会显示可恢复页面，
 * 而不是白屏（尤其重要：WebView / 桌面端打包环境）。
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) }
  }

  componentDidCatch(error, info) {
    console.error('[SoulMate] render error:', error, info)
  }

  handleReset = () => {
    // 清空本地登录态与缓存后重载（WebView 中相对跳转不可靠，用 reload）
    try {
      localStorage.removeItem('soulmate_token')
      localStorage.removeItem('soulmate_user')
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }
    return (
      <div className="min-h-screen gradient-warmth flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center animate-slide-up">
          <div className="text-5xl mb-4">💔</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">出了点问题</h1>
          <p className="text-sm text-gray-400 mb-4 break-all">
            {this.state.message || '应用遇到未知错误'}
          </p>
          <button
            onClick={this.handleReset}
            className="w-full py-3 bg-gradient-to-r from-rose-400 to-warmth-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            清空本地数据并重试
          </button>
          <p className="text-xs text-gray-300 mt-4">若问题持续，请更新到最新版本</p>
        </div>
      </div>
    )
  }
}
