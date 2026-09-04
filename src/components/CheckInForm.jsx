import React from 'react'
import { todayStr, weekdayCN } from '../lib/date'
import { EMPTY_CHECKIN } from '../lib/storage'

const NUM_FIELDS = [
  ['weight', '体重', 'kg', 0.1],
  ['calories', '摄入热量', 'kcal', 1],
  ['protein', '蛋白质', 'g', 1],
  ['carbs', '碳水', 'g', 1],
  ['fat', '脂肪', 'g', 1],
  ['water', '饮水', '杯', 1],
  ['sleepHours', '睡眠', '小时', 0.5],
  ['workoutMinutes', '运动时长', '分钟', 5],
]

export default function CheckInForm({ checkins, plan, onSave }) {
  const [date, setDate] = React.useState(todayStr())
  const existing = checkins[date]
  const [form, setForm] = React.useState({ ...EMPTY_CHECKIN, ...(existing || {}) })
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    setForm({ ...EMPTY_CHECKIN, ...(checkins[date] || {}) })
    setSaved(false)
  }, [date, checkins])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = () => {
    onSave(date, form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const target = plan?.dailyCalories

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight">每日打卡</h3>
          <p className="text-xs text-slate-400">选择日期可补记 / 修改历史记录</p>
        </div>
        <input type="date" className="input !w-auto" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-500">
        {date} · 星期{weekdayCN(date)}
        {existing && <span className="chip ml-2 bg-emerald-100 text-emerald-700">已打卡，可编辑</span>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {NUM_FIELDS.map(([k, l, u, step]) => (
          <div key={k}>
            <label className="label">
              {l}
              {k === 'calories' && target ? <span className="ml-1 font-normal text-indigo-500">目标 {target}</span> : null}
              {k === 'protein' && plan ? <span className="ml-1 font-normal text-indigo-500">目标 {plan.macros.protein}g</span> : null}
            </label>
            <div className="relative">
              <input
                className="input pr-9"
                type="number"
                step={step}
                min="0"
                value={form[k]}
                onChange={(e) => set(k, e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="—"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">{u}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <input
            id="wd"
            type="checkbox"
            className="h-5 w-5 rounded accent-indigo-600"
            checked={!!form.workoutDone}
            onChange={(e) => set('workoutDone', e.target.checked)}
          />
          <label htmlFor="wd" className="text-sm font-semibold text-slate-700">今日训练已完成</label>
        </div>
        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">压力自评</span>
            <span className={`chip ${form.stress >= 4 ? 'bg-rose-100 text-rose-700' : form.stress >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {['', '很低', '较低', '中等', '偏高', '很高'][form.stress || 3]}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={form.stress || 3}
            onChange={(e) => set('stress', Number(e.target.value))}
            className="mt-2 w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>轻松</span><span>高压</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">备注（吃了什么 / 状态如何，可选）</label>
        <textarea
          className="input min-h-[68px] resize-y"
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="例：聚餐吃多了，明天加一次有氧…"
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button className="btn-primary" onClick={submit}>{existing ? '更新打卡' : '保存打卡'}</button>
        {saved && <span className="text-sm font-semibold text-emerald-600">✓ 已保存到本机</span>}
      </div>
    </div>
  )
}
