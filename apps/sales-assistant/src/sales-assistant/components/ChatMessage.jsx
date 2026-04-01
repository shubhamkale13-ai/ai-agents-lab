import React from 'react'
import { Bot, User2 } from 'lucide-react'
import { motion } from 'framer-motion'
import AIResponseCard from './AIResponseCard'

export default function ChatMessage({ message, isDark, onRegenerate }) {
  const isAssistant = message.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex max-w-3xl gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
        <div
          className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            isAssistant
              ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
              : isDark
                ? 'bg-white/10 text-slate-100'
                : 'bg-slate-900 text-white'
          }`}
        >
          {isAssistant ? <Bot size={18} /> : <User2 size={18} />}
        </div>

        {isAssistant ? (
          <AIResponseCard content={message.content} metadata={message.metadata} isDark={isDark} onRegenerate={onRegenerate} />
        ) : (
          <div
            className={`rounded-[28px] border px-5 py-4 text-sm leading-7 ${
              isDark
                ? 'border-white/8 bg-white/[0.06] text-slate-100'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </motion.div>
  )
}
