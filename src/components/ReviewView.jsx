import React from 'react'
import { weeklyReview, monthlyReview } from '../lib/review'

const TONE_STYLE = {
  good: 'border-emerald-200 bg-emerald-50/60',
  warn: 'border-amber-200 bg-amber-50/60',
  bad: 'border-rose-200 bg-rose-50/60',
}
const TONE_BADGE = {
  good: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  bad: 'bg-rose-100 text-rose-700',
}
const TONE_LABEL = { good: '保持', warn: '关注', bad: '干预' }

function ScoreRing({ score }) {
  const r = 40
  const c = 2 * Math.PI * r
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#e11d48'
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color }}>{score}</span>
        <span className="text-[10px] font-semibold text-slate-400">执行力</span>
      </div>
    </div>
  )
}

function ReviewCard({ title, review }) {
  if (!review) return null
  const s = review.stats
  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-4">
        <ScoreRing score={review.score} />
        <div className="min-w-[200px] flex-1">
          <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>打卡 <b className="text-slate-700">{s.checkinDays}/{s.totalDays} 天</b></span>
            <span>体重变化 <b className="text-slate-700">{s.weightDelta == null ? '—' : `${s.weightDelta > 0 ? '+' : ''}${s.weightDelta} kg`}</b></span>
            <span>运动 <b className="text-slate-700">{s.workoutDays} 次</b></span>
            {s.avgCalories != null && <span>日均热量 <b className="text-slate-700">{s.avgCalories} kcal</b></span>}
            {s.avgSleep != null && <span>日均睡眠 <b className="text-slate-700">{s.avgSleep} h</b></span>}
            {s.avgStress != null && <span>压力 <b className="text-slate-700">{s.avgStress}/5</b></span>}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {review.items.map((it, i) => (
          <div key={i} className={`rounded-xl border px-4 py-3 ${TONE_STYLE[it.tone]}`}>
            <div className="flex items-center gap-2">
              <span className={`chip ${TONE_BADGE[it.tone]}`}>{TONE_LABEL[it.tone]}</span>
              <span className="text-sm font-bold text-slate-800">{it.title}</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{it.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReviewView({ checkins, plan, settings, today }) {
  const weekly = React.useMemo(() => weeklyReview(checkins, plan, settings, today), [checkins, plan, settings, today])
  const monthly = React.useMemo(() => monthlyReview(checkins, plan, settings, today), [checkins, plan, settings, today])
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-slate-800 px-4 py-3 text-xs leading-relaxed text-slate-200">
        复盘规则：评分从 100 起扣，依据打卡率、体重变化、热量执行、蛋白质、睡眠、压力、运动完成度与饮水八项指标。
        建议涵盖防暴食心理干预、压力管理与睡眠修复，按「保持 / 关注 / 干预」三级呈现。
      </div>
      <ReviewCard title="本周复盘（近 7 天）" review={weekly} />
      <ReviewCard title="本月复盘（近 30 天）" review={monthly} />
    </div>
  )
}
