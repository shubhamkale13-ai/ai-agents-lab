import React from 'react'
import { Copy, Mail, PencilLine, SendHorizontal } from 'lucide-react'

export default function EmailCard({ content, email, isDark }) {
  const lines = content.split('\n').filter(Boolean)
  const subjectLine = email?.subject
    ? `Subject: ${email.subject}`
    : (lines.find((line) => /^subject:/i.test(line)) || 'Subject: Drafted customer follow-up')
  const bodyLines = email?.body
    ? email.body.split('\n').filter(Boolean)
    : lines.filter((line) => !/^subject:/i.test(line))

  return (
    <div className={`mb-5 rounded-[28px] border p-4 ${isDark ? 'border-indigo-400/20 bg-indigo-500/8' : 'border-indigo-200 bg-indigo-50/80'}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
            <Mail size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold">Email Draft</div>
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ready to review and copy</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {[
            { icon: Copy, label: 'Copy' },
            { icon: PencilLine, label: 'Edit' },
            { icon: SendHorizontal, label: 'Send' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className={`rounded-2xl border px-3 py-2 transition ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={14} />
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl border p-4 ${isDark ? 'border-white/8 bg-slate-950/45' : 'border-slate-200 bg-white'}`}>
        <div className="mb-3 text-sm font-semibold">{subjectLine.replace(/^subject:\s*/i, '')}</div>
        <div className={`space-y-3 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {bodyLines.map((line, index) => (
            <p key={`${index}-${line.slice(0, 12)}`}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
