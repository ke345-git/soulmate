import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Cpu, Circle } from 'lucide-react'
import useModelStore from '@/stores/modelStore'
import { cn } from '@/lib/utils'

export default function ModelSelector() {
  const { models, activeModel, setActiveModel } = useModelStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-warmth-200 rounded-xl text-xs hover:border-rose-300 transition-colors"
      >
        <Cpu className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-600 max-w-[80px] truncate">
          {activeModel?.name || '未选择模型'}
        </span>
        <ChevronDown className={cn('w-3 h-3 text-gray-300 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-warmth-200 rounded-2xl shadow-lg overflow-hidden z-50">
          <div className="p-2 max-h-48 overflow-y-auto">
            {models.length === 0 ? (
              <p className="text-xs text-gray-400 p-3 text-center">
                暂无模型配置，请在设置中添加
              </p>
            ) : (
              models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setActiveModel(model)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                    activeModel?.id === model.id
                      ? 'bg-rose-50'
                      : 'hover:bg-warmth-50'
                  )}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    model.is_active ? 'bg-green-400' : 'bg-gray-300'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{model.name}</p>
                    <p className="text-xs text-gray-400 truncate">{model.model}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
