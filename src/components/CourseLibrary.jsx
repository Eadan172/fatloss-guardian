import React from 'react'

// 运动课程库：把 Keep / 薄荷健康等 App 中跟练的课程手动录入一次，
// 打卡页会按星期自动生成当日课程清单（勾选联动训练完成状态与时长）。
export const APP_OPTIONS = [
  ['keep', 'Keep'],
  ['boohee', '薄荷健康'],
  ['other', '其他'],
]

export const WEEKDAY_OPTIONS = [
  [1, '周一'],
  [2, '周二'],
  [3, '周三'],
  [4, '周四'],
  [5, '周五'],
  [6, '周六'],
  [0, '周日'],
]

const EMPTY = { name: '', app: 'keep', minutes: 30, weekday: 1, link: '' }

export function weekdayLabel(w) {
  return WEEKDAY_OPTIONS.find(([v]) => v === Number(w))?.[1] || '—'
}

export function AppBadge({ app }) {
  const style = {
    keep: 'bg-emerald-100 text-emerald-700',
    boohee: 'bg-sky-100 text-sky-700',
    other: 'bg-slate-100 text-slate-600',
  }[app] || 'bg-slate-100 text-slate-600'
  const label = APP_OPTIONS.find(([v]) => v === app)?.[1] || '其他'
  return <span className={`chip ${style}`}>{label}</span>
}

export default function CourseLibrary({ courses, onChange }) {
  const [form, setForm] = React.useState(EMPTY)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const add = () => {
    if (!form.name.trim()) return
    onChange([
      ...courses,
      { ...form, id: Date.now(), name: form.name.trim(), minutes: Number(form.minutes) || 0, weekday: Number(form.weekday) },
    ])
    setForm(EMPTY)
  }
  const remove = (id) => onChange(courses.filter((c) => c.id !== id))

  const mondayFirst = (w) => (Number(w) + 6) % 7 // 周一=0 … 周日=6
  const sorted = [...courses].sort((a, b) => mondayFirst(a.weekday) - mondayFirst(b.weekday) || a.id - b.id)

  return (
    <div className="card">
      <div>
        <h3 className="text-lg font-extrabold tracking-tight">我的运动课程库</h3>
        <p className="mt-0.5 text-xs text-slate-400">
          把 Keep / 薄荷健康里跟练的课程录入一次（App 无开放接口，需手动录入），打卡页将按星期自动列出当日课程，勾选即联动训练完成状态与时长
        </p>
      </div>

      {sorted.length > 0 && (
        <ul className="mt-4 space-y-2">
          {sorted.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5">
              <span className="chip bg-indigo-100 text-indigo-700">{weekdayLabel(c.weekday)}</span>
              <span className="text-sm font-bold text-slate-700">{c.name}</span>
              <AppBadge app={c.app} />
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
          <label className="label">安排星期</label>
          <select className="input" value={form.weekday} onChange={(e) => set('weekday', e.target.value)}>
            {WEEKDAY_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">时长（分钟）</label>
          <input className="input" type="number" min="0" step="5" value={form.minutes} onChange={(e) => set('minutes', e.target.value)} />
        </div>
        <div>
          <label className="label">课程链接（可选）</label>
          <input className="input" value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="粘贴课程页 URL" />
        </div>
        <div className="col-span-2 sm:col-span-6">
          <button className="btn-primary w-full sm:w-auto" onClick={add} disabled={!form.name.trim()}>
            + 添加课程
          </button>
        </div>
      </div>
    </div>
  )
}
