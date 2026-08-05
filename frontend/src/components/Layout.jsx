import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { MessageCircle, Users, Settings, Cpu, LogOut, Menu, X, Heart } from 'lucide-react'
import useAuthStore from '@/stores/authStore'

const navItems = [
  { to: '/chat', icon: MessageCircle, label: '对话' },
  { to: '/characters', icon: Users, label: '角色' },
  { to: '/models', icon: Cpu, label: '模型' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-warmth-50 via-white to-rose-50">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧导航栏 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 glass-strong flex flex-col
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-warmth-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-warmth-500 flex items-center justify-center text-white text-lg shadow-md">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">SoulMate</h1>
              <p className="text-xs text-gray-400">AI 情感陪伴</p>
            </div>
          </div>
        </div>

        {/* 导航链接 */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-100 to-warmth-100 text-rose-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-warmth-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 用户信息 + 退出 */}
        <div className="p-4 border-t border-warmth-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-warmth-300 to-rose-300 flex items-center justify-center text-lg">
              {user?.avatar || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user?.username || '用户'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 移动端顶部栏 */}
        <header className="lg:hidden flex items-center gap-3 p-4 glass">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-warmth-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-warmth-500 flex items-center justify-center text-white">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-800">SoulMate</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
