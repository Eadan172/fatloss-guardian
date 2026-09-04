import React from 'react'
import StatCard from './StatCard'

export default function PlanView({ plan, profile, onRegenerate }) {
  if (!plan) return null
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="每日热量目标" value={plan.dailyCalories} unit="kcal" sub={`TDEE ${plan.tdee} − 缺口 ${plan.deficit}`} />
        <StatCard title="蛋白质" value={plan.macros.protein} unit="g/天" sub="保肌肉、强饱腹" />
        <StatCard title="碳水" value={plan.macros.carbs} unit="g/天" sub="训练能量来源" />
        <StatCard title="脂肪" value={plan.macros.fat} unit="g/天" sub="激素合成必需" />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">周期预测</h3>
            <p className="text-sm text-slate-500">
              按每周约 <b className="text-indigo-600">{plan.weeklyLoss} kg</b> 的速度，从 {profile.startWeight} kg 减至 {profile.targetWeight} kg 预计需要{' '}
              <b className="text-indigo-600">{plan.estWeeks} 周</b>。
            </p>
          </div>
          <button className="btn-ghost" onClick={onRegenerate}>重新生成计划</button>
        </div>
        <p className="mt-3 rounded-xl bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-indigo-800">{plan.note}</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-extrabold tracking-tight">{plan.workout.title}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {plan.workout.days.map((d) => (
            <div key={d.day} className="rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center gap-2">
                <span className="chip bg-indigo-100 text-indigo-700">{d.day}</span>
                <span className="text-sm font-bold">{d.focus}</span>
              </div>
              <ul className="mt-2 space-y-1 text-[13px] text-slate-600">
                {d.moves.map((m) => (
                  <li key={m} className="flex gap-1.5">
                    <span className="text-slate-300">•</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-extrabold tracking-tight">饮食执行要点</h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {plan.dietTips.map((t, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-700">
              <span className="mt-0.5 font-extrabold text-emerald-500">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
