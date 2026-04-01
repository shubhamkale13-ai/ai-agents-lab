import React, { useState, useCallback } from 'react'
import Aurora from './components/Aurora'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import InputBar from './components/InputBar'

const uid = () => 'c' + Date.now() + Math.random().toString(36).slice(2, 6)
const load = () => { try { return JSON.parse(localStorage.getItem('crm_sessions') || '{}') } catch { return {} } }

export default function App() {
  const [sessions, setSessions] = useState(load)
  const [activeId, setActiveId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [streamText, setStreamText] = useState(null)

  const save = useCallback((s) => {
    setSessions(s)
    localStorage.setItem('crm_sessions', JSON.stringify(s))
  }, [])

  const history = activeId ? (sessions[activeId]?.history || []) : []

  const sendMessage = useCallback(async (msg) => {
    if (!msg.trim() || isLoading) return
    setIsLoading(true)
    setStreamText(null)

    let sessId = activeId
    let currentSessions = sessions

    if (!sessId || !currentSessions[sessId]) {
      sessId = uid()
      currentSessions = {
        ...currentSessions,
        [sessId]: { title: msg.slice(0, 44) + (msg.length > 44 ? '…' : ''), history: [], ts: Date.now() }
      }
      setActiveId(sessId)
    }

    const currentHistory = currentSessions[sessId].history
    const newHistory = [...currentHistory, { role: 'user', content: msg }]
    save({ ...currentSessions, [sessId]: { ...currentSessions[sessId], history: newHistory } })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: currentHistory }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      save({ ...currentSessions, [sessId]: { ...currentSessions[sessId], history: data.history } })
      setStreamText(data.response)
    } catch (err) {
      const errHistory = [...newHistory, { role: 'assistant', content: `⚠️ ${err.message}` }]
      save({ ...currentSessions, [sessId]: { ...currentSessions[sessId], history: errHistory } })
    }

    setIsLoading(false)
  }, [activeId, sessions, isLoading, save])

  const onStreamComplete = useCallback(() => setStreamText(null), [])
  const newChat = useCallback(() => { setActiveId(null); setStreamText(null) }, [])
  const loadSession = useCallback((id) => { setActiveId(id); setStreamText(null) }, [])
  const deleteSession = useCallback((id) => {
    const s = { ...sessions }
    delete s[id]
    save(s)
    if (activeId === id) { setActiveId(null); setStreamText(null) }
  }, [sessions, activeId, save])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0F172A' }}>
      <Aurora isThinking={isLoading} />
      <Sidebar sessions={sessions} activeId={activeId} onNew={newChat} onLoad={loadSession} onDelete={deleteSession} />
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-xl flex-shrink-0">
          <div>
            <div className="text-sm font-semibold text-slate-100 truncate max-w-xs">
              {activeId && sessions[activeId] ? sessions[activeId].title : 'CRM AI Assistant'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Apex · SOQL · LWC · Flows · Integrations</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-indigo-300 font-medium">llama-3.3-70b</span>
          </div>
        </header>
        <ChatArea history={history} isLoading={isLoading} streamText={streamText} onStreamComplete={onStreamComplete} onChipClick={sendMessage} />
        <InputBar onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
