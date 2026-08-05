import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import LoginView from '@/views/LoginView'
import RegisterView from '@/views/RegisterView'
import ChatView from '@/views/ChatView'
import CharactersView from '@/views/CharactersView'
import CharacterDetailView from '@/views/CharacterDetailView'
import ModelConfigView from '@/views/ModelConfigView'
import SettingsView from '@/views/SettingsView'

/** 路由守卫 — 检查是否登录 */
function RequireAuth({ children }) {
  const token = localStorage.getItem('soulmate_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

/** 未登录时重定向到登录页 */
function RedirectIfAuth({ children }) {
  const token = localStorage.getItem('soulmate_token')
  if (token) {
    return <Navigate to="/chat" replace />
  }
  return children
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuth>
        <LoginView />
      </RedirectIfAuth>
    ),
  },
  {
    path: '/register',
    element: (
      <RedirectIfAuth>
        <RegisterView />
      </RedirectIfAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: 'chat', element: <ChatView /> },
      { path: 'chat/:sessionId', element: <ChatView /> },
      { path: 'characters', element: <CharactersView /> },
      { path: 'characters/:id', element: <CharacterDetailView /> },
      { path: 'models', element: <ModelConfigView /> },
      { path: 'settings', element: <SettingsView /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/chat" replace />,
  },
])

export default router
