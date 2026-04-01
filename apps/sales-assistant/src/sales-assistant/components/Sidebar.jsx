import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquarePlus, Search, Sparkles, Trash2 } from 'lucide-react'

function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export default function Sidebar({
  sessions,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  isOpen,
  onClose,
  theme,
}) {
  const isDark = theme === 'dark'
  const sortedSessions = Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <motion.aside
      animate={{ width: isOpen ? 310 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 250, damping: 28 }}
      className={`relative z-20 hidden shrink-0 overflow-hidden border-r lg:block ${
        isDark ? 'border-white/8 bg-slate-950/65' : 'border-slate-200 bg-white/80'
      }`}
    >
      <div className="flex h-full flex-col backdrop-blur-xl">
        <div className="border-b border-inherit p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Workspace
              </div>
              <div className="mt-1 text-lg font-semibold">Sales Assistant</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-2xl border px-3 py-1.5 text-xs transition ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              Hide
            </button>
          </div>

          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-900/30"
          >
            <span>New Chat</span>
            <MessageSquarePlus size={18} />
          </button>

          <div className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <Search size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Conversation history</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {sortedSessions.length === 0 ? (
            <div className={`rounded-3xl border p-5 text-sm ${isDark ? 'border-white/8 bg-white/5 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
              Ask the assistant to review pipeline, summarize a renewal, or draft a customer email.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedSessions.map((session) => {
                const active = session.id === activeId
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSelect(session.id)}
                    className={`group w-full rounded-3xl border p-4 text-left transition ${
                      active
                        ? isDark
                          ? 'border-indigo-400/40 bg-indigo-500/14'
                          : 'border-indigo-300 bg-indigo-50'
                        : isDark
                          ? 'border-white/6 bg-white/[0.03] hover:bg-white/[0.06]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{session.title}</div>
                        <div className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {formatTimestamp(session.updatedAt)}
                        </div>
                      </div>
                      <span
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete(session.id)
                        }}
                        className={`rounded-xl p-2 opacity-0 transition group-hover:opacity-100 ${
                          isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                        }`}
                      >
                        <Trash2 size={14} />
                      </span>
                    </div>
                    <div className={`line-clamp-2 text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {session.history[session.history.length - 1]?.content || 'No messages yet'}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-inherit p-4">
          <div className={`rounded-3xl border p-4 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'}`}>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Sparkles size={15} className={isDark ? 'text-indigo-300' : 'text-indigo-600'} />
              Sales shortcuts
            </div>
            <div className={`space-y-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <div>/email drafts an outbound message</div>
              <div>/analyze asks for deal scoring</div>
              <div>/prioritize ranks current pipeline</div>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
