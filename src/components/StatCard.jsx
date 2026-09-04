import React from 'react'

export default function StatCard({ title, value, unit, sub, tone = 'default' }) {
  const tones = {
    default: 'border-slate-200',
    good: 'border-emerald-300 bg-emerald-50/50',
    warn: 'border-amber-300 bg-amber-50/50',
    bad: 'border-rose-300 bg-rose-50/50',
  }
  return (
    <div className={`card !p-4 border ${tones[tone]}`}>
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
