import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  BriefcaseBusiness,
  ChevronLeft,
  Menu,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  SunMedium,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatMessage from './components/ChatMessage'
import InputBox from './components/InputBox'
import CRMInsightsPanel from './components/CRMInsightsPanel'

const STORAGE_KEY = 'sales_assistant_sessions_v1'
const THEME_KEY = 'sales_assistant_theme'
const API_BASE_URL = import.meta.env.VITE_SALES_API_BASE_URL || ''

const STARTER_PROMPTS = [
  'Prioritize my open opportunities for this week',
  'Analyze risk for the Northstar renewal',
  'Draft a follow-up email for the Redwood deal',
  'Summarize all stalled deals with next best actions',
]

function uid() {
  return `sa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
}

function summarizeConversation(history) {
  const firstUser = history.find((item) => item.role === 'user')
  if (!firstUser) return 'New Sales Chat'
  return firstUser.content.slice(0, 52) + (firstUser.content.length > 52 ? '...' : '')
}

function extractInsights(metadata) {
  const source = metadata?.opportunity_insights || {}
  return {
    dealValue: source.deal_value || 'Not surfaced yet',
    stage: source.stage || 'Waiting for analysis',
    riskLevel: source.risk_level || 'medium',
    lastActivity: source.last_activity || 'No activity detected',
  }
}

function buildRecommendedActions(metadata) {
  const actions = metadata?.recommended_actions || []
  if (!actions.length) {
    return [
      '/analyze Prioritize my open pipeline with reasons',
      '/email Draft a concise executive follow-up email',
      'Show me deals with no recent activity and a missing next step',
    ]
  }

  return actions.slice(0, 3)
}

export default function ChatLayout() {
  const [sessions, setSessions] = useState(() => loadSessions())
  const [activeId, setActiveId] = useState(null)
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)
  const [theme, setTheme] = useState(() => loadTheme())
  const scrollRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeId, sessions, isLoading])

  const activeSession = activeId ? sessions[activeId] : null
  const history = activeSession?.history || []
  const lastAssistantMessage = [...history].reverse().find((item) => item.role === 'assistant')
  const assistantMetadata = lastAssistantMessage?.metadata || null
  const insights = useMemo(() => extractInsights(assistantMetadata), [assistantMetadata])
  const accountSummary = assistantMetadata?.account_summary || { key_contacts: [], engagement_score: null }
  const recommendedActions = useMemo(
    () => buildRecommendedActions(assistantMetadata),
    [assistantMetadata],
  )

  function persistSession(id, updater) {
    setSessions((current) => {
      const session = current[id]
      if (!session) return current
      return { ...current, [id]: updater(session) }
    })
  }

  function createSession(initialMessage = '') {
    const id = uid()
    const session = {
      id,
      title: initialMessage ? initialMessage.slice(0, 52) + (initialMessage.length > 52 ? '...' : '') : 'New Sales Chat',
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSessions((current) => ({ ...current, [id]: session }))
    setActiveId(id)
    return id
  }

  async function sendMessage(rawMessage) {
    const trimmed = rawMessage.trim()
    if (!trimmed || isLoading) return

    const sessionId = activeId || createSession(trimmed)
    const existingHistory = sessions[sessionId]?.history || []
    const nextHistory = [...existingHistory, { role: 'user', content: trimmed }]

    persistSession(sessionId, (session) => ({
      ...session,
      title: summarizeConversation(nextHistory),
      history: nextHistory,
      updatedAt: Date.now(),
    }))

    setDraft('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: existingHistory }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      persistSession(sessionId, (session) => ({
        ...session,
        title: summarizeConversation(data.history),
        history: data.history,
        updatedAt: Date.now(),
      }))
    } catch (error) {
      persistSession(sessionId, (session) => ({
        ...session,
        history: [...nextHistory, { role: 'assistant', content: `Error: ${error.message}`, metadata: null }],
        updatedAt: Date.now(),
      }))
    } finally {
      setIsLoading(false)
    }
  }

  function handleRegenerate() {
    const lastUserMessage = [...history].reverse().find((item) => item.role === 'user')
    if (!lastUserMessage || !activeId) return

    const trimmedHistory = [...history]
    while (trimmedHistory.length && trimmedHistory[trimmedHistory.length - 1].role !== 'user') {
      trimmedHistory.pop()
    }

    persistSession(activeId, (session) => ({
      ...session,
      history: trimmedHistory,
      updatedAt: Date.now(),
    }))

    window.setTimeout(() => sendMessage(lastUserMessage.content), 0)
  }

  const dark = theme === 'dark'

  return (
    <div className={`relative flex h-screen overflow-hidden ${dark ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F3F6FC] text-slate-900'}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -left-28 top-12 h-72 w-72 rounded-full blur-3xl ${dark ? 'bg-indigo-500/18' : 'bg-indigo-300/35'}`} />
        <div className={`absolute right-0 top-0 h-80 w-80 rounded-full blur-3xl ${dark ? 'bg-fuchsia-500/14' : 'bg-violet-300/30'}`} />
        <div className={`absolute bottom-0 left-1/3 h-72 w-72 rounded-full blur-3xl ${dark ? 'bg-cyan-500/10' : 'bg-sky-300/25'}`} />
      </div>

      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNewChat={() => {
          setActiveId(null)
          setDraft('')
        }}
        onSelect={setActiveId}
        onDelete={(id) => {
          setSessions((current) => {
            const next = { ...current }
            delete next[id]
            return next
          })
          if (activeId === id) {
            setActiveId(null)
            setDraft('')
          }
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className={`flex items-center justify-between border-b px-4 py-4 backdrop-blur xl:px-6 ${dark ? 'border-white/8 bg-slate-950/50' : 'border-slate-200 bg-white/72'}`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className={`rounded-2xl border p-2.5 transition ${dark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>

            <div>
              <div className={`rounded-2xl border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${dark ? 'border-indigo-400/20 bg-indigo-500/10 text-indigo-200' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                Sales Assistant
              </div>
              <h1 className="mt-2 text-lg font-semibold">
                {activeSession?.title || 'Premium Salesforce sales workspace'}
              </h1>
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Pipeline coaching, risk detection, next best actions, and email drafting in one place.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              className={`rounded-2xl border p-2.5 transition ${dark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
            <button
              type="button"
              onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              className={`rounded-2xl border p-2.5 transition ${dark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              {dark ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 xl:px-8">
              {history.length === 0 ? (
                <div className="mx-auto flex h-full max-w-4xl flex-col justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[32px] border p-8 shadow-2xl ${dark ? 'border-white/10 bg-white/5 shadow-indigo-950/30' : 'border-white bg-white/90 shadow-slate-300/40'}`}
                  >
                    <div className="mb-8 flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 shadow-lg shadow-indigo-900/40">
                        <BriefcaseBusiness size={26} className="text-white" />
                      </div>
                      <div>
                        <div className={`text-xs font-semibold uppercase tracking-[0.3em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Salesforce AI
                        </div>
                        <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                          Ask about pipeline, risk, renewals, and next steps.
                        </h2>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {STARTER_PROMPTS.map((prompt, index) => (
                        <motion.button
                          key={prompt}
                          type="button"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06 }}
                          onClick={() => {
                            setDraft(prompt)
                            sendMessage(prompt)
                          }}
                          className={`group rounded-3xl border p-5 text-left transition ${dark ? 'border-white/8 bg-slate-950/40 hover:border-indigo-400/40 hover:bg-indigo-500/10' : 'border-slate-200 bg-slate-50/90 hover:border-indigo-300 hover:bg-indigo-50'}`}
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <Sparkles size={18} className={dark ? 'text-indigo-300' : 'text-indigo-600'} />
                            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Starter</span>
                          </div>
                          <div className="text-sm font-medium">{prompt}</div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                  <AnimatePresence initial={false}>
                    {history.map((message, index) => (
                      <ChatMessage
                        key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                        message={message}
                        isDark={dark}
                        onRegenerate={message.role === 'assistant' ? handleRegenerate : undefined}
                      />
                    ))}
                    {isLoading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`mr-auto max-w-2xl rounded-[28px] rounded-tl-md border p-5 ${
                          dark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                            <Bot size={18} />
                          </div>
                          <div>
                            <div className="font-medium">Sales Assistant</div>
                            <div className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Thinking through CRM context</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
                          <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
                          <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/10" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <InputBox
              value={draft}
              onChange={setDraft}
              onSend={() => sendMessage(draft)}
              isLoading={isLoading}
              isDark={dark}
              commandSuggestions={[
                '/email Draft a customer follow-up email',
                '/analyze Analyze the deal and classify risk',
                '/prioritize Rank my pipeline by urgency',
              ]}
            />
          </main>

          <CRMInsightsPanel
            isOpen={panelOpen}
            isDark={dark}
            insights={insights}
            accountSummary={accountSummary}
            recommendedActions={recommendedActions}
            onActionClick={setDraft}
          />
        </div>
      </div>
    </div>
  )
}
