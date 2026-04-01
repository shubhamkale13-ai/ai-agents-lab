import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Code2, Database, GitBranch, Layers, Bug } from 'lucide-react'
import Message from './Message'

const CHIPS = [
  { icon: Code2,     label: 'Write a bulk-safe Apex trigger' },
  { icon: Database,  label: 'Optimize my SOQL query' },
  { icon: Layers,    label: 'Build an LWC component' },
  { icon: GitBranch, label: 'Explain governor limits' },
  { icon: Zap,       label: 'REST API integration pattern' },
  { icon: Bug,       label: 'Debug this Apex error' },
]

function ThinkingBubble() {
  return (
    <motion.div className="flex gap-3 items-start"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
      <div className="relative flex-shrink-0">
        <div className="absolute inset-[-3px] rounded-[13px] ring-spin" />
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white z-10 shadow-lg">AI</div>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800 border border-slate-700/60 flex items-center gap-2">
        <span className="text-[13px] text-slate-400 mr-1">Thinking</span>
        {[0,1,2].map(i => (
          <motion.span key={i} className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500"
            animate={{ y: [0,-6,0], opacity: [0.3,1,0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }} />
        ))}
      </div>
    </motion.div>
  )
}

function Welcome({ onChipClick }) {
  return (
    <motion.div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <motion.div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-5 animate-float"
        style={{ boxShadow: '0 0 32px rgba(99,102,241,0.45)' }}>
        <Zap size={28} className="text-white" fill="white" />
      </motion.div>
      <h1 className="text-2xl font-bold mb-2 text-slate-100">Salesforce CRM Assistant</h1>
      <p className="text-[14px] text-slate-400 max-w-md leading-relaxed mb-8">Expert help for Apex, SOQL, LWC, Flows, integrations, and everything Salesforce.</p>
      <div className="flex flex-wrap gap-2 justify-center max-w-[560px]">
        {CHIPS.map(({ icon: Icon, label }, i) => (
          <motion.button key={label} onClick={() => onChipClick(label)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12.5px] text-slate-300 border border-slate-700 bg-slate-800/60 hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:text-white transition-all"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Icon size={13} className="text-indigo-400" />{label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export default function ChatArea({ history, isLoading, streamText, onStreamComplete, onChipClick }) {
  const bottomRef = useRef(null)
  const [streamDone, setStreamDone] = useState(false)

  useEffect(() => { setStreamDone(false) }, [streamText])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history.length, isLoading, streamText])

  const handleStreamDone = () => { setStreamDone(true); setTimeout(() => onStreamComplete?.(), 100) }
  const displayHistory = streamText ? history.slice(0, -1) : history

  return (
    <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarGutter: 'stable' }}>
      {history.length === 0 && !isLoading ? (
        <Welcome onChipClick={onChipClick} />
      ) : (
        <div className="max-w-[800px] mx-auto px-6 py-8 flex flex-col gap-5">
          <AnimatePresence initial={false}>
            {displayHistory.map((msg, i) => <Message key={i} role={msg.role} content={msg.content} />)}
            {streamText && !streamDone && <Message key="stream" role="assistant" content="" isStreaming streamText={streamText} onStreamDone={handleStreamDone} />}
            {isLoading && !streamText && <ThinkingBubble key="thinking" />}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
