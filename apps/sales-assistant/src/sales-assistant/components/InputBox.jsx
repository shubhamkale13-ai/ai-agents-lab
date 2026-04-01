import React, { useEffect, useMemo, useRef } from 'react'
import { ArrowUp, Command, Sparkles } from 'lucide-react'

export default function InputBox({
  value,
  onChange,
  onSend,
  isLoading,
  isDark,
  commandSuggestions,
}) {
  const textareaRef = useRef(null)
  const showCommands = value.trim().startsWith('/')
  const filteredCommands = useMemo(() => {
    if (!showCommands) return []
    return commandSuggestions.filter((item) => item.toLowerCase().includes(value.trim().toLowerCase()))
  }, [commandSuggestions, showCommands, value])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }, [value])

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSend()
    }
  }

  return (
    <div className={`border-t px-4 pb-5 pt-4 xl:px-8 ${isDark ? 'border-white/8 bg-slate-950/55' : 'border-slate-200 bg-white/82'}`}>
      <div className="mx-auto max-w-5xl">
        {showCommands && filteredCommands.length > 0 && (
          <div className={`mb-3 rounded-3xl border p-2 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            {filteredCommands.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition ${
                  isDark ? 'hover:bg-white/8' : 'hover:bg-white'
                }`}
              >
                <Command size={14} className={isDark ? 'text-indigo-300' : 'text-indigo-600'} />
                {item}
              </button>
            ))}
          </div>
        )}

        <div className={`rounded-[32px] border p-3 shadow-2xl ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-slate-300/30'}`}>
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${isDark ? 'bg-indigo-500/10 text-indigo-200' : 'bg-indigo-50 text-indigo-700'}`}>
              <Sparkles size={14} />
              Commands: /email /analyze /prioritize
            </div>
          </div>
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              placeholder="Ask about a deal, create an email draft, or run /analyze on an opportunity"
              className={`min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none ${
                isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
            />
            <button
              type="button"
              onClick={onSend}
              disabled={isLoading || !value.trim()}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                isLoading || !value.trim()
                  ? isDark
                    ? 'bg-white/8 text-slate-500'
                    : 'bg-slate-100 text-slate-400'
                  : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-900/30'
              }`}
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
