import { cn } from '@/lib/utils'
import { resolveAssetUrl } from '@/lib/api'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function ChatBubble({ message, character }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const charAvatar = character?.avatar_image || character?.avatar || '🤖'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = message.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={cn(
        'flex gap-3 animate-slide-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* AI 头像 */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-warmth-300 to-rose-300 flex items-center justify-center flex-shrink-0 text-lg shadow-sm">
          {character?.avatar_image ? (
            <img src={resolveAssetUrl(character.avatar_image)} alt="" className="w-full h-full object-cover" />
          ) : (
            charAvatar
          )}
        </div>
      )}

      {/* 消息内容 */}
      <div className={cn('group relative max-w-[75%] sm:max-w-[65%]', isUser ? 'order-1' : 'order-2')}>
        <div
          className={cn(
            'px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words',
            isUser ? 'chat-bubble-user shadow-sm' : 'chat-bubble-assistant shadow-sm'
          )}
        >
          {message.content || (
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-gray-300 rounded-full typing-dot" />
              <span className="w-2 h-2 bg-gray-300 rounded-full typing-dot" />
            </span>
          )}
        </div>

        {/* 复制按钮 */}
        {message.content && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-1 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white rounded-full shadow-sm text-gray-300 hover:text-gray-500 transition-all"
            title="复制"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* 用户头像 */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-warmth-500 flex items-center justify-center flex-shrink-0 text-white text-sm font-medium order-2 shadow-sm">
          我
        </div>
      )}
    </div>
  )
}
