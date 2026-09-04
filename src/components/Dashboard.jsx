import React from 'react'
import WeightChart from './WeightChart'
import StatCard from './StatCard'
import { reboundStatus } from '../lib/review'
import { todayStr, addDays } from '../lib/date'

// 计算最近 N 天体重点 + 7 日均线
export function buildWeightPoints(checkins, n = 30, end = todayStr()) {
  const pts = []
  const window = []
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(end, -i)
    const c = checkins[d]
    const w = c && Number(c.weight) > 0 ? Number(c.weight) : null
    if (w == null) continue
    window.push(w)
    if (window.length > 7) window.shift()
    const avg = window.reduce((a, b) => a + b, 0) / window.length
    pts.push({ date: d, weight: w, avg: Math.round(avg * 100) / 100 })
  }
  return pts
}

function streakDays(checkins) {
  let n = 0
  let d = todayStr()
  while (checkins[d]) {
    n++
    d = addDays(d, -1)
  }
  return n
}

const BANNER = {
  ok: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  warn: 'bg-amber-50 border-amber-300 text-amber-800',
  danger: 'bg-rose-50 border-rose-300 text-rose-800',
  none: 'bg-slate-50 border-slate-300 text-slate-600',
}
const BANNER_ICON = { ok: '✓', warn: '⚠', danger: '🚨', none: 'ℹ' }

function Progress({ label, value, target, unit, color = 'bg-indigo-500' }) {
  const pct = target > 0 && value != null ? Math.min(100, Math.round((value / target) * 100)) : 0
  const over = target > 0 && value != null && value > target * 1.15
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className={`font-bold ${over ? 'text-rose-600' : 'text-slate-700'}`}>
          {value ?? '—'} / {target} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : color}`} style={{ width: `${over ? 100 : pct}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard({ state, today }) {
  const { checkins, plan, settings, profile } = state
  const points = React.useMemo(() => buildWeightPoints(checkins, 30, today), [checkins, today])
  const status = reboundStatus(points, settings)
  const streak = streakDays(checkins)
  const c = checkins[today]

  const latestW = points.length ? points[points.length - 1].weight : null
  const weekAgoW = points.length >= 8 ? points[points.length - 8].weight : points.length ? points[0].weight : null
  const delta7 = latestW != null && weekAgoW != null ? Math.round((latestW - weekAgoW) * 100) / 100 : null
  const toTarget = latestW != null && profile ? Math.round((latestW - profile.targetWeight) * 10) / 10 : null

  return (
    <div className="space-y-5">
      {/* 防反弹预警横幅 */}
      <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${BANNER[status.level]}`}>
        {BANNER_ICON[status.level]} {status.message}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="当前体重"
          value={latestW != null ? latestW.toFixed(1) : '—'}
          unit="kg"
          sub={toTarget != null ? (toTarget > 0 ? `距目标还差 ${toTarget} kg` : '🎉 已达成目标，进入维持期') : '完成今日打卡开始记录'}
        />
        <StatCard
          title="近 7 天变化"
          value={delta7 != null ? `${delta7 > 0 ? '+' : ''}${delta7}` : '—'}
          unit="kg"
          tone={delta7 == null ? 'default' : delta7 <= 0 ? 'good' : 'warn'}
          sub="健康速度：每周 -0.3 ~ -0.8 kg"
        />
        <StatCard title="连续打卡" value={streak} unit="天" sub="不中断的链条就是动力" tone={streak >= 7 ? 'good' : 'default'} />
        <StatCard
          title="今日热量"
          value={c && c.calories ? c.calories : '—'}
          unit="kcal"
          sub={plan ? `目标 ${plan.dailyCalories} kcal` : '生成计划后显示目标'}
          tone={c && c.calories && plan ? (Number(c.calories) <= plan.dailyCalories * 1.05 ? 'good' : 'warn') : 'default'}
        />
      </div>

      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold tracking-tight">体重走势 · 近 30 天</h3>
          <span className="text-xs text-slate-400">蓝线为 7 日均线（预警判定依据），灰点为每日实测</span>
        </div>
        <WeightChart points={points} low={settings.safeZoneLow} high={settings.safeZoneHigh} rebound={settings.reboundLine} />
      </div>

      <div className="card">
        <h3 className="text-lg font-extrabold tracking-tight">今日执行进度</h3>
        {c ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Progress label="热量" value={c.calories || null} target={plan?.dailyCalories || 0} unit="kcal" color="bg-indigo-500" />
            <Progress label="蛋白质" value={c.protein || null} target={plan?.macros.protein || 0} unit="g" color="bg-emerald-500" />
            <Progress label="饮水" value={c.water || null} target={settings.waterGoal} unit="杯" color="bg-sky-500" />
            <Progress label="睡眠" value={c.sleepHours || null} target={settings.sleepGoal} unit="h" color="bg-violet-500" />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">今天还没有打卡 — 前往「打卡」页记录体重、饮食与习惯。</p>
        )}
        {c && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className={`chip ${c.workoutDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {c.workoutDone ? `✓ 训练完成${c.workoutMinutes ? ` ${c.workoutMinutes} 分钟` : ''}` : '今日未训练'}
            </span>
            <span className={`chip ${(c.stress || 3) >= 4 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
              压力 {['', '很低', '较低', '中等', '偏高', '很高'][c.stress || 3]}
            </span>
            {c.note && <span className="chip bg-indigo-50 text-indigo-600">📝 {c.note.slice(0, 40)}{c.note.length > 40 ? '…' : ''}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
