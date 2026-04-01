import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Copy, RefreshCcw } from 'lucide-react'
import EmailCard from './EmailCard'

function parseSections(content) {
  const sections = []
  const lines = content.split('\n')
  let current = { title: 'Summary', body: [] }
  lines.forEach(line => {
    const header = line.match(/^(#{1,3}\s*)?(Summary|Risks|Actions|Recommended Actions|Next Best Action|Account Summary|Opportunity Insights)\s*:?\s*$/i)
    if (header) { if (current.body.length) sections.push({ ...current, body: current.body.join('\n').trim() }); current = { title: header[2], body: [] }; return }
    current.body.push(line)
  })
  if (current.body.length) sections.push({ ...current, body: current.body.join('\n').trim() })
  return sections.filter(s => s.body)
}

function formatBody(body) {
  return body.split('\n').map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return <div key={`space-${index}`} className="h-3" />
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={`item-${index}`} className="ml-5 list-disc leading-7">{trimmed.slice(2)}</li>
    return <p key={`line-${index}`} className="leading-7">{trimmed}</p>
  })
}

export default function AIResponseCard({ content, metadata, isDark, onRegenerate }) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const sections = useMemo(() => parseSections(content), [content])
  const emailMatch = metadata?.email?.subject || content.match(/Subject:\s*(.+)/i)

  async function handleCopy() { await navigator.clipboard.writeText(content); setCopied(true); window.setTimeout(() => setCopied(false), 1200) }

  return (
    <div className={`w-full rounded-[30px] border p-5 shadow-2xl ${isDark ? 'border-white/10 bg-slate-950/55 shadow-indigo-950/20' : 'border-slate-200 bg-white shadow-slate-300/30'}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Sales Assistant</div>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Structured response</div>
        </div>
        <div className="flex items-center gap-2">
          {[{ icon: Copy, label: copied ? 'Copied' : 'Copy', action: handleCopy }, { icon: RefreshCcw, label: 'Regenerate', action: onRegenerate }].map(({ icon: Icon, label, action }) => (
            <button key={label} type="button" onClick={action} className={`rounded-2xl border px-3 py-2 text-xs transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
              <span className="flex items-center gap-2"><Icon size={14} />{label}</span>
            </button>
          ))}
        </div>
      </div>
      {emailMatch && <EmailCard content={content} email={metadata?.email} isDark={isDark} />}
      <div className="space-y-3">
        {(sections.length ? sections : [{ title: 'Response', body: content }]).map(section => {
          const isCollapsed = collapsed[section.title]
          return (
            <div key={section.title} className={`rounded-3xl border ${isDark ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-slate-50/80'}`}>
              <button type="button" onClick={() => setCollapsed(c => ({ ...c, [section.title]: !c[section.title] }))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <span className="text-sm font-semibold">{section.title}</span>
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              {!isCollapsed && <div className={`border-t px-4 py-4 text-sm ${isDark ? 'border-white/8 text-slate-200' : 'border-slate-200 text-slate-700'}`}>{formatBody(section.body)}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
