import React from 'react'
import { todayStr, fmtCN, weekdayCN } from '../lib/date'

// 运动课程库：把 Keep / 薄荷健康等 App 中跟练的课程按上课日期手动录入一次，
// 打卡页会按日期自动生成当日课程清单（勾选联动训练完成状态与时长）。
export const APP_OPTIONS = [
  ['keep', 'Keep'],
  ['boohee', '薄荷健康'],
  ['other', '其他'],
]

const EMPTY = { name: '', app: 'keep', customApp: '', minutes: 30, date: todayStr(), link: '' }

export function courseDateLabel(d) {
  return d ? `${fmtCN(d)} · 周${weekdayCN(d)}` : '—'
}

export function AppBadge({ app, customApp }) {
  const style = {
    keep: 'bg-emerald-100 text-emerald-700',
    boohee: 'bg-sky-100 text-sky-700',
    other: 'bg-slate-100 text-slate-600',
  }[app] || 'bg-slate-100 text-slate-600'
  const label = app === 'other' && customApp ? customApp : APP_OPTIONS.find(([v]) => v === app)?.[1] || '其他'
  return <span className={`chip ${style}`}>{label}</span>
}

export default function CourseLibrary({ courses, onChange }) {
  const [form, setForm] = React.useState(EMPTY)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const invalid = !form.name.trim() || !form.date || (form.app === 'other' && !form.customApp.trim())

  const add = () => {
    if (invalid) return
    onChange([
      ...courses,
      {
        id: Date.now(),
        name: form.name.trim(),
        app: form.app,
        customApp: form.app === 'other' ? form.customApp.trim() : '',
        minutes: Number(form.minutes) || 0,
        date: form.date,
        link: form.link.trim(),
      },
    ])
    setForm(EMPTY)
  }
  const remove = (id) => onChange(courses.filter((c) => c.id !== id))

  const sorted = [...courses].sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id)

  return (
    <div className="card">
      <div>
        <h3 className="text-lg font-extrabold tracking-tight">我的运动课程库</h3>
        <p className="mt-0.5 text-xs text-slate-400">
          把 Keep / 薄荷健康里跟练的课程按上课日期录入（App 无开放接口，需手动录入），打卡页将按当天日期自动列出课程，勾选即联动训练完成状态与时长
        </p>
      </div>

      {sorted.length > 0 && (
        <ul className="mt-4 space-y-2">
          {sorted.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5">
              <span className="chip bg-indigo-100 text-indigo-700">{courseDateLabel(c.date)}</span>
              <span className="text-sm font-bold text-slate-700">{c.name}</span>
              <AppBadge app={c.app} customApp={c.customApp} />
              <span className="text-xs text-slate-400">{c.minutes} 分钟</span>
              <span className="ml-auto flex items-center gap-2">
                {c.link && (
                  <a href={c.link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-indigo-500 hover:underline">
                    打开课程 ↗
                  </a>
                )}
                <button className="text-xs font-semibold text-slate-300 hover:text-rose-500" onClick={() => remove(c.id)}>
                  删除
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 sm:grid-cols-6">
        <div className="col-span-2">
          <label className="label">课程名称</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="例：HIIT 燃脂全身" />
        </div>
        <div>
          <label className="label">来源 App</label>
          <select className="input" value={form.app} onChange={(e) => set('app', e.target.value)}>
            {APP_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">上课日期</label>
          <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className="label">时长（分钟）</label>
          <input className="input" type="number" min="0" step="5" value={form.minutes} onChange={(e) => set('minutes', e.target.value)} />
        </div>
        <div>
          <label className="label">课程链接（可选）</label>
          <input className="input" value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="粘贴课程页 URL" />
        </div>
        {form.app === 'other' && (
          <div className="col-span-2">
            <label className="label">来源名称（手动填写）</label>
            <input
              className="input"
              value={form.customApp}
              onChange={(e) => set('customApp', e.target.value)}
              placeholder="例：B站跟练 / 华为运动健康"
            />
          </div>
        )}
        <div className="col-span-2 sm:col-span-6">
          <button className="btn-primary w-full sm:w-auto" onClick={add} disabled={invalid}>
            + 添加课程
          </button>
        </div>
      </div>
    </div>
  )
}
