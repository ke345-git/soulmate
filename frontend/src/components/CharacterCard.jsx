import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveAssetUrl } from '@/lib/api'

export default function CharacterCard({ character, onClick, onChat }) {
  const tags = (character.personality || []).slice(0, 3)

  return (
    <div
      onClick={onClick}
      className="group glass rounded-2xl p-4 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 animate-fade-in"
    >
      {/* 头像 */}
      <div className="flex flex-col items-center mb-3">
        <div className={cn(
          'w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-3 transition-transform group-hover:scale-110',
          character.is_preset
            ? 'bg-gradient-to-br from-warmth-100 to-rose-100'
            : 'bg-gradient-to-br from-purple-100 to-blue-100'
        )}>
          {character.avatar_image ? (
            <img
              src={resolveAssetUrl(character.avatar_image)}
              alt={character.name}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            character.avatar || '😊'
          )}
        </div>

        <h3 className="font-semibold text-gray-700 text-sm">{character.name}</h3>

        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-rose-50 text-rose-500 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2 text-center line-clamp-2">
          {character.background || character.style || '暂无描述'}
        </p>
      </div>

      {/* 底部操作 */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-warmth-100">
        <span className="text-xs text-gray-300">
          💬 {character.chat_count || 0} 次聊天
        </span>
      </div>
    </div>
  )
}
