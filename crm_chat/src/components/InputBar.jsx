import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export default function InputBar({ onSend, isLoading }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => { if (!isLoading) textareaRef.current?.focus() }, [isLoading])

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const handleSend = () => {
    const msg = value.trim()
    if (!msg || isLoading) return
    onSend(msg); setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const canSend = value.trim().length > 0 && !isLoading

  return (
    <div className="px-6 pb-6 pt-3 flex-shrink-0" style={{ background: 'linear-gradient(to top, #0F172A 70%, transparent)' }}>
      <div className="max-w-[800px] mx-auto">
        <div className="relative">
          <AnimatePresence>
            {focused && (
              <motion.div className="absolute inset-[-1px] rounded-2xl pointer-events-none overflow-hidden z-0"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="absolute inset-0 input-focused-border opacity-50" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`relative z-10 flex items-end gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${focused ? 'bg-slate-800/90 border-transparent' : 'bg-slate-800/60 border-slate-700/60'}`}>
            <textarea ref={textareaRef} value={value}
              onChange={e => { setValue(e.target.value); resize() }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              disabled={isLoading} rows={1}
              placeholder="Ask about Salesforce, Apex, SOQL, LWC, Flows…"
              className="flex-1 bg-transparent outline-none resize-none text-[14px] text-slate-100 placeholder:text-slate-600 leading-relaxed disabled:opacity-40"
              style={{ minHeight: '24px', maxHeight: '160px', overflowY: 'auto' }}
            />
            <motion.button onClick={handleSend} disabled={!canSend}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${canSend ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-700/60 text-slate-600 cursor-not-allowed'}`}
              whileHover={canSend ? { scale: 1.06 } : {}} whileTap={canSend ? { scale: 0.92 } : {}}>
              <ArrowUp size={15} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
        <p className="text-center text-[11px] text-slate-700 mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
