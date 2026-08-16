import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveAssetUrl } from '@/lib/api'

export default function CharacterSelector({ characters, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = characters.find((c) => c.id === selectedId)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-warmth-200 rounded-xl text-sm hover:border-rose-300 transition-colors"
      >
        {selected?.avatar_image ? (
          <img src={resolveAssetUrl(selected.avatar_image)} alt="" className="w-6 h-6 rounded-lg object-cover" />
        ) : (
          <span className="text-lg">{selected?.avatar || '😊'}</span>
        )}
        <span className="text-gray-700 font-medium">
          {selected?.name || '选择角色'}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-gray-300 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-64 bg-white border border-warmth-200 rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="p-2 max-h-64 overflow-y-auto">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => {
                  onSelect(char.id)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                  selectedId === char.id
                    ? 'bg-rose-50'
                    : 'hover:bg-warmth-50'
                )}
              >
                {char.avatar_image ? (
                  <img src={resolveAssetUrl(char.avatar_image)} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <span className="text-2xl">{char.avatar}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{char.name}</p>
                  <div className="flex gap-1 mt-0.5">
                    {(char.personality || []).slice(0, 2).map((p) => (
                      <span key={p} className="px-1.5 py-0.5 bg-warmth-100 text-gray-500 text-xs rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
