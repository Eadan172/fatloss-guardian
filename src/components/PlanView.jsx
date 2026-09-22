import React from 'react'
import StatCard from './StatCard'
import CourseLibrary, { courseDateLabel, AppBadge } from './CourseLibrary'
import LinkedMove from './LinkedMove'
import { todayStr } from '../lib/date'
import { LEVEL_OPTIONS, SESSION_MINUTE_OPTIONS, LIMITATION_LABEL } from '../lib/exerciseLibrary'

const PLAN_MODES = [
  ['platform', '平台生成方案'],
  ['app', '运动软件跟课'],
]

const KIND_STYLE = {
  strength: 'bg-indigo-50 text-indigo-700',
  cardio: 'bg-emerald-50 text-emerald-700',
  mobility: 'bg-slate-100 text-slate-600',
}
const KIND_LABEL = { strength: '力量', cardio: '有氧', mobility: '拉伸' }

const PHASE_TONE = {
  适应期: 'bg-sky-50 text-sky-700 border-sky-200',
  建立期: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  加强期: 'bg-amber-50 text-amber-800 border-amber-200',
  减载周: 'bg-violet-50 text-violet-700 border-violet-200',
}

export default function PlanView({ plan, profile, courses = [], onUpdateCourses, onRegenerate, onUpdateTraining }) {
  const [mode, setMode] = React.useState('platform')

  // 本地编辑态：调整训练设置后点「应用」重新生成
  const [form, setForm] = React.useState({
    trainingLevel: profile?.trainingLevel,
    weeklyDays: profile?.weeklyDays,
    sessionMinutes: profile?.sessionMinutes,
  })
  React.useEffect(() => {
    setForm({
      trainingLevel: profile?.trainingLevel,
      weeklyDays: profile?.weeklyDays,
      sessionMinutes: profile?.sessionMinutes,
    })
  }, [profile?.trainingLevel, profile?.weeklyDays, profile?.sessionMinutes])

  if (!plan) return null

  const w = plan.workout || {}
  const rx = w.prescription
  const phase = w.phase
  const limits = profile?.limitations || []
  const dirty =
    form.trainingLevel !== profile?.trainingLevel ||
    form.weeklyDays !== profile?.weeklyDays ||
    form.sessionMinutes !== profile?.sessionMinutes

  return (
    <div className="space-y-5">
      {/* ============ 水平与周期阶段 ============ */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-gradient-to-r from-indigo-600 to-violet-600 text-white">{plan.levelLabel || 'K1'}</span>
          {phase && (
            <span className={`chip border ${PHASE_TONE[phase.name] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {phase.name} · 第 {w.cycleWeek} 周（总第 {w.weekIndex} 周）
            </span>
          )}
          {w.splitName && <span className="chip bg-slate-100 text-slate-600">{w.splitName}</span>}
          <span className="chip bg-slate-100 text-slate-600">力量 {w.strengthDays} 天 / 每周</span>
          {plan.bmi ? <span className="chip bg-slate-100 text-slate-600">BMI {plan.bmi}</span> : null}
          <button className="btn-ghost ml-auto !px-3 !py-1.5 !text-xs" onClick={onRegenerate}>按当前体重重算</button>
        </div>
        {phase && (
          <p className="mt-3 rounded-xl bg-indigo-50 px-4 py-3 text-xs leading-relaxed text-indigo-800">
            <b>{phase.name}</b>：{phase.desc}
            <br />本阶段目标 —— {phase.focus}
          </p>
        )}
        {limits.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">已登记的受限部位</span>
            {limits.map((l) => (
              <span key={l} className="chip bg-rose-50 text-rose-700">{LIMITATION_LABEL[l] || l}</span>
            ))}
          </div>
        )}
      </div>

      {/* ============ 热量与宏量 ============ */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="每日热量目标" value={plan.dailyCalories} unit="kcal" sub={`TDEE ${plan.tdee} − 缺口 ${plan.deficit}`} />
        <StatCard title="蛋白质" value={plan.macros.protein} unit="g/天" sub={`约 ${plan.proteinPerMealG} g × ${plan.mealsPerDay} 餐`} />
        <StatCard title="碳水" value={plan.macros.carbs} unit="g/天" sub="训练能量来源" />
        <StatCard title="脂肪" value={plan.macros.fat} unit="g/天" sub="激素合成必需，不低于 0.6 g/kg" />
      </div>

      {/* ============ 训练处方 ============ */}
      {rx && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold tracking-tight">训练处方</h3>
            <span className="text-[11px] font-semibold text-slate-400">所有动作都不做到力竭</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center md:grid-cols-5">
            {[
              ['复合动作', `${rx.setsCompound} 组`, `${rx.repsCompound} 次`],
              ['孤立动作', `${rx.setsIsolation} 组`, `${rx.repsIsolation} 次`],
              ['组间休息', `${rx.restCompound} 秒`, `孤立 ${rx.restIsolation} 秒`],
              ['强度（RPE）', rx.rpe, rx.rpeDesc],
              ['余力（RIR）', `留 ${rx.rir} 次`, '不做到力竭'],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="text-[11px] font-semibold text-slate-400">{k}</div>
                <div className="text-base font-extrabold text-slate-800">{v}</div>
                <div className="text-[10px] leading-tight text-slate-500">{s}</div>
              </div>
            ))}
          </div>
          {w.cardioNote && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900">{w.cardioNote}</p>
          )}
        </div>
      )}

      {/* ============ 周期预测 ============ */}
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

      {/* ============ 锻炼方案 ============ */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">锻炼方案</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {mode === 'platform'
                ? `${w.title || ''} · 专业名词可点击查看动作介绍`
                : '跟随 Keep / 薄荷健康等 App 的课程训练，在下方课程库按上课日期录入'}
            </p>
          </div>
          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
            {PLAN_MODES.map(([v, l]) => (
              <button key={v} className={`tab-btn ${mode === v ? 'tab-btn-active' : ''}`} onClick={() => setMode(v)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {mode === 'platform' ? (
          <>
            <p className="mt-3 text-xs text-slate-400">
              点击任意一天展开热身、动作要领与冷身安排{w.totalMinutes ? ` · 每周合计约 ${Math.round(w.totalMinutes / 60)} 小时` : ''}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {(w.days || []).map((d) => (
                <details key={d.day} className="rounded-xl border border-slate-200 p-3.5 open:bg-slate-50/60">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                    <span className={`chip ${d.isRest ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-700'}`}>{d.day}</span>
                    <span className={`text-sm font-bold ${d.isRest ? 'text-slate-400' : 'text-slate-800'}`}>{d.title || d.focus}</span>
                    {!d.isRest && d.durationMin ? (
                      <span className="chip bg-white text-slate-500 ring-1 ring-slate-200">约 {d.durationMin} 分钟</span>
                    ) : null}
                  </summary>

                  {d.warmup && d.warmup.length > 0 && (
                    <div className="mt-3 rounded-lg bg-sky-50 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600">热身</div>
                      <div className="mt-0.5 text-[12px] text-sky-900">{d.warmup.join(' → ')}</div>
                    </div>
                  )}

                  <ul className="mt-2.5 space-y-2">
                    {(d.exercises || []).map((e, i) => (
                      <li key={`${d.day}-${e.id}-${i}`} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`chip ${KIND_STYLE[e.kind] || KIND_STYLE.mobility}`}>{KIND_LABEL[e.kind] || '动作'}</span>
                          <span className="text-[13px] font-bold text-slate-800">
                            <LinkedMove move={e.label || e.name} />
                          </span>
                          {e.en && <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">{e.en}</span>}
                          <span className="ml-auto text-[13px] font-extrabold text-indigo-600">{e.sets}</span>
                        </div>
                        <div className="mt-1 text-[12px] leading-relaxed text-slate-500">要领：{e.cues}</div>
                        {e.note && <div className="mt-1 text-[12px] leading-relaxed text-amber-700">提示：{e.note}</div>}
                      </li>
                    ))}
                  </ul>

                  {d.cooldown && d.cooldown.length > 0 && (
                    <div className="mt-2.5 rounded-lg bg-slate-100 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">冷身拉伸</div>
                      <div className="mt-0.5 text-[12px] text-slate-700">{d.cooldown.join(' → ')}</div>
                    </div>
                  )}

                  {d.note && <p className="mt-2.5 text-[12px] leading-relaxed text-slate-500">{d.note}</p>}
                </details>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-3">
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-800">
              跟课方案以下方「运动课程库」为准：按上课日期录入课程后，每日打卡会自动列出当天课程，勾选即自动回填运动时长。
            </p>
            {courses.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {[...courses]
                  .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id)
                  .map((c) => {
                    const isToday = c.date === todayStr()
                    return (
                      <li
                        key={c.id}
                        className={`flex flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5 ${isToday ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200'}`}
                      >
                        <span className={`chip ${isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{courseDateLabel(c.date)}</span>
                        {isToday && <span className="chip bg-indigo-600 text-white">今天</span>}
                        <span className="text-sm font-bold text-slate-700">{c.name}</span>
                        <AppBadge app={c.app} customApp={c.customApp} />
                        <span className="text-xs text-slate-400">{c.minutes} 分钟</span>
                        {c.link && (
                          <a href={c.link} target="_blank" rel="noreferrer" className="ml-auto text-xs font-semibold text-indigo-500 hover:underline">
                            打开课程 ↗
                          </a>
                        )}
                      </li>
                    )
                  })}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs text-slate-400">
                课程库还是空的 —— 在下方「我的运动课程库」按上课日期录入第一节课，这里就会列出清单。
              </p>
            )}
          </div>
        )}
      </div>

      <CourseLibrary courses={courses} onChange={onUpdateCourses} />

      {/* ============ 进阶路线 ============ */}
      {w.progression && (
        <div className="card">
          <h3 className="text-lg font-extrabold tracking-tight">7 周进阶路线</h3>
          <p className="mt-1 text-sm text-slate-500">
            每 7 周一个循环，第 7 周主动减载。进阶优先加「组数」而不是追重量 —— 对减脂期的新手，动作质量比数字重要得多。
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-semibold">周次</th>
                  <th className="py-2 pr-3 font-semibold">阶段</th>
                  <th className="py-2 pr-3 font-semibold">训练量</th>
                  <th className="py-2 font-semibold">重点</th>
                </tr>
              </thead>
              <tbody>
                {w.progression.map((p) => (
                  <tr key={p.weeks} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-semibold text-slate-700">{p.weeks}</td>
                    <td className="py-2 pr-3">
                      <span className={`chip border ${PHASE_TONE[p.phase] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{p.phase}</span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{p.volume}</td>
                    <td className="py-2 text-slate-500">{p.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ 安全说明 ============ */}
      {((w.safetyNotes && w.safetyNotes.length > 0) || (w.excluded && w.excluded.length > 0)) && (
        <div className="card border-amber-200">
          <h3 className="text-lg font-extrabold tracking-tight text-amber-800">安全说明与已排除项</h3>
          {w.excluded && w.excluded.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">已自动排除</span>
              {w.excluded.map((x) => (
                <span key={x} className="chip bg-rose-50 text-rose-700">{x}</span>
              ))}
            </div>
          )}
          <ul className="mt-3 space-y-2">
            {(w.safetyNotes || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 rounded-xl bg-amber-50/70 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-900">
                <span className="mt-0.5 font-extrabold text-amber-500">!</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ============ 训练设置调整 ============ */}
      {onUpdateTraining && (
        <div className="card">
          <h3 className="text-lg font-extrabold tracking-tight">调整训练设置</h3>
          <p className="mt-1 text-sm text-slate-500">
            进步了就把水平升一档，引擎会重新按新水平编排动作难度；时间变少就调低单次时长，动作数量会自动跟着减。
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">运动水平</label>
              <select className="input" value={form.trainingLevel} onChange={(e) => setForm((f) => ({ ...f, trainingLevel: e.target.value }))}>
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">每周训练天数</label>
              <select className="input" value={form.weeklyDays} onChange={(e) => setForm((f) => ({ ...f, weeklyDays: Number(e.target.value) }))}>
                {[2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>{d} 天</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">单次时长</label>
              <select className="input" value={form.sessionMinutes} onChange={(e) => setForm((f) => ({ ...f, sessionMinutes: Number(e.target.value) }))}>
                {SESSION_MINUTE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            伤病限制（{limits.length ? limits.map((l) => LIMITATION_LABEL[l]).join('、') : '无'}）需重新建档时调整；如已恢复，可在「设置」中清空数据后重新建档。
          </div>
          <button className="btn-primary mt-4" disabled={!dirty} onClick={() => onUpdateTraining(form)}>
            应用并重新生成计划
          </button>
        </div>
      )}

      {/* ============ 饮食执行要点 ============ */}
      <div className="card">
        <h3 className="text-lg font-extrabold tracking-tight">饮食执行要点</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          <span className="chip bg-slate-100 text-slate-600">纤维 {plan.fiberG} g</span>
          <span className="chip bg-slate-100 text-slate-600">饮水 {plan.waterMl} ml</span>
          <span className="chip bg-slate-100 text-slate-600">缺口上限 TDEE 的 {Math.round((plan.deficitCapPct || 0.25) * 100)}%</span>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {plan.dietTips.map((t, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[13px] text-slate-700">
              <span className="mt-0.5 font-extrabold text-emerald-500">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* ============ 一日参考餐单 ============ */}
      {plan.meals && plan.meals.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-extrabold tracking-tight">一日参考餐单</h3>
          <p className="mt-1 text-xs text-slate-400">按 {plan.mealsPerDay} 餐拆分，每餐蛋白质约 {plan.proteinPerMealG} g；同类食物可自由替换</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {plan.meals.map((m) => (
              <div key={m.meal} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">{m.meal}</span>
                  <span className="chip bg-indigo-100 text-indigo-700">约 {m.kcal} kcal</span>
                </div>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-600">
                  {m.items.map((it) => (
                    <li key={it} className="flex gap-1.5">
                      <span className="text-slate-300">•</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
