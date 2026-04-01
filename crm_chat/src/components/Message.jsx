import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)
  const code = String(children).replace(/\n$/, '')
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/60">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{language || 'code'}</span>
        </div>
        <button onClick={copy} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${copied ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8' : 'text-slate-500 border-slate-700 hover:text-slate-300 hover:bg-slate-700/50'}`}>
          {copied ? <Check size={11}/> : <Copy size={11}/>}{copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter language={language || 'text'} style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '16px', background: '#0D1526', fontSize: '12.5px', lineHeight: '1.65' }}
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{ color: 'rgba(148,163,184,0.25)', fontSize: '11px', minWidth: '2.5em' }}
      >{code}</SyntaxHighlighter>
    </div>
  )
}

function MarkdownContent({ content }) {
  return (
    <div className="prose-ai text-sm text-slate-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        code({ inline, className, children }) {
          const lang = /language-(\w+)/.exec(className || '')?.[1]
          return !inline && lang ? <CodeBlock language={lang}>{children}</CodeBlock>
            : <code className="font-mono text-[12.5px] bg-indigo-500/15 px-1.5 py-0.5 rounded text-indigo-300">{children}</code>
        },
        pre({ children }) { return <>{children}</> },
      }}>{content}</ReactMarkdown>
    </div>
  )
}

export function StreamingMessage({ fullText, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const ref = useRef({ i: 0, text: fullText })

  useEffect(() => {
    ref.current = { i: 0, text: fullText }
    setDisplayed(''); setDone(false)
    let timer
    const tick = () => {
      const { i, text } = ref.current
      if (i >= text.length) { setDone(true); onDone?.(); return }
      const batch = i < 80 ? 1 : Math.ceil((text.length - 80) / 25)
      ref.current.i = Math.min(i + batch, text.length)
      setDisplayed(text.slice(0, ref.current.i))
      timer = setTimeout(tick, i < 80 ? 11 : 14)
    }
    timer = setTimeout(tick, 30)
    return () => clearTimeout(timer)
  }, [fullText])

  if (done) return <MarkdownContent content={fullText} />
  return (
    <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
      {displayed}<span className="inline-block w-[2px] h-[14px] bg-indigo-400 ml-0.5 align-text-bottom animate-blink" />
    </div>
  )
}

export default function Message({ role, content, isStreaming = false, streamText = null, onStreamDone }) {
  const isUser = role === 'user'
  return (
    <motion.div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <div className="relative flex-shrink-0">
        {isStreaming && !isUser && <div className="absolute inset-[-3px] rounded-[13px] ring-spin" />}
        <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold z-10 ${isUser ? 'bg-slate-700 text-slate-300' : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30'}`}>
          {isUser ? 'U' : 'AI'}
        </div>
      </div>
      <div className={`flex flex-col gap-1 max-w-[76%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-lg shadow-indigo-600/25' : 'bg-slate-800 border border-slate-700/60 text-slate-200 rounded-tl-sm'}`}>
          {isUser ? <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
            : isStreaming && streamText ? <StreamingMessage fullText={streamText} onDone={onStreamDone} />
            : <MarkdownContent content={content} />}
        </div>
        <span className="text-[10px] text-slate-600 px-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </motion.div>
  )
}
