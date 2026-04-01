import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Trash2, Zap } from 'lucide-react'

export default function Sidebar({ sessions, activeId, onNew, onLoad, onDelete }) {
  const sorted = Object.entries(sessions).sort(([,a],[,b]) => b.ts - a.ts)

  return (
    <aside className="w-64 min-w-[256px] flex flex-col h-screen border-r border-slate-700/50 relative z-10" style={{ background: '#0D1526' }}>
      <div className="px-4 pt-5 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
            <Zap size={17} className="text-white" fill="white" />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-slate-100">CRM Assistant</div>
            <div className="text-[10.5px] text-slate-500">salesforceninja.dev</div>
          </div>
        </div>
        <motion.button onClick={onNew}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-slate-300 border border-slate-600/60 bg-slate-800/50 hover:bg-slate-700/60 hover:border-slate-500 hover:text-white transition-all"
          whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} className="text-indigo-400" /> New Conversation
        </motion.button>
      </div>
      <div className="px-3 pt-3 pb-1">
        <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase px-1.5 mb-1">Conversations</div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-0">
        <AnimatePresence initial={false}>
          {sorted.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[12px] text-slate-600 py-8 px-4 leading-relaxed">
              No conversations yet.<br />Start one below.
            </motion.div>
          ) : sorted.map(([id, session]) => (
            <motion.div key={id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}
              onClick={() => onLoad(id)}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer mb-0.5 transition-all ${id === activeId ? 'bg-indigo-600/20 border border-indigo-500/30 text-slate-100' : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-200'}`}
            >
              <MessageSquare size={13} className={id === activeId ? 'text-indigo-400 flex-shrink-0' : 'text-slate-600 flex-shrink-0'} />
              <span className="flex-1 text-[12.5px] truncate">{session.title}</span>
              <motion.button onClick={e => { e.stopPropagation(); onDelete(id) }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/15 hover:text-red-400 text-slate-600 transition-all" whileTap={{ scale: 0.9 }}>
                <Trash2 size={11} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="px-4 py-3 border-t border-slate-700/50 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] text-slate-500"><span className="text-indigo-400 font-medium">Groq</span> · Llama 3.3 70B</span>
      </div>
    </aside>
  )
}
