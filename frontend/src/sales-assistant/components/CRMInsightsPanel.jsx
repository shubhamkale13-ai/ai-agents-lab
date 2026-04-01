import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  ChevronRight,
  CircleUserRound,
  Signal,
} from 'lucide-react'

function riskClasses(level, isDark) {
  if (level === 'high') return isDark ? 'bg-rose-500/12 text-rose-300' : 'bg-rose-50 text-rose-700'
  if (level === 'low') return isDark ? 'bg-emerald-500/12 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
  return isDark ? 'bg-amber-500/12 text-amber-300' : 'bg-amber-50 text-amber-700'
}

export default function CRMInsightsPanel({
  isOpen,
  isDark,
  insights,
  accountSummary,
  recommendedActions,
  onActionClick,
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.24 }}
          className={`hidden w-[360px] shrink-0 border-l xl:block ${
            isDark ? 'border-white/8 bg-slate-950/55' : 'border-slate-200 bg-white/75'
          }`}
        >
          <div className="flex h-full flex-col gap-4 overflow-y-auto p-5 backdrop-blur-xl">
            <section className={`rounded-[28px] border p-5 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 text-sm font-semibold">Opportunity Insights</div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><BadgeDollarSign size={15} /> Deal value</span>
                  <span className="font-medium">{insights.dealValue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Signal size={15} /> Stage</span>
                  <span className="font-medium">{insights.stage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><AlertTriangle size={15} /> Risk level</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${riskClasses(insights.riskLevel, isDark)}`}>
                    {insights.riskLevel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><CalendarClock size={15} /> Last activity</span>
                  <span className="font-medium">{insights.lastActivity}</span>
                </div>
              </div>
            </section>

            <section className={`rounded-[28px] border p-5 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 text-sm font-semibold">Account Summary</div>
              <div className="space-y-3 text-sm">
                <div className={`rounded-2xl border p-3 ${isDark ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="mb-1 flex items-center gap-2 font-medium">
                    <CircleUserRound size={15} />
                    Key contacts
                  </div>
                  <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {accountSummary?.key_contacts?.length
                      ? accountSummary.key_contacts.join(', ')
                      : 'No key contacts surfaced yet.'}
                  </div>
                </div>
                <div className={`rounded-2xl border p-3 ${isDark ? 'border-white/8 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="mb-1 font-medium">Engagement score</div>
                  <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {accountSummary?.engagement_score || 'Not available yet.'}
                  </div>
                </div>
              </div>
            </section>

            <section className={`rounded-[28px] border p-5 ${isDark ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 text-sm font-semibold">Recommended Actions</div>
              <div className="space-y-2">
                {recommendedActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => onActionClick(action)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isDark
                        ? 'border-white/8 bg-white/[0.03] hover:border-indigo-400/30 hover:bg-indigo-500/10'
                        : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="pr-4">{action}</span>
                    <ChevronRight size={15} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                  </button>
                ))}
              </div>
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
