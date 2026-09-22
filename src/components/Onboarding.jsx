import React from 'react'
import { ACTIVITY_LEVELS, WEEKLY_LOSS_OPTIONS } from '../lib/plan'
import { LEVEL_OPTIONS, LEVEL_DESC, LIMITATION_OPTIONS, SESSION_MINUTE_OPTIONS } from '../lib/exerciseLibrary'

// 首次使用引导：录入档案 → 生成计划 → 自动初始化防反弹区间
// v3 重点：把「真实运动水平」作为一等公民。旧版只问器械，所以零基础用户与老手拿到同一份计划。
export default function Onboarding({ onSubmit }) {
  const [form, setForm] = React.useState({
    name: '',
    gender: 'male',
    age: 30,
    heightCm: 170,
    startWeight: 80,
    targetWeight: 70,
    activity: 1.375,
    equipment: 'none',
    diet: 'balanced',
    // ---- v3 新增 ----
    trainingLevel: 'k1',
    weeklyDays: 3,
    sessionMinutes: 30,
    limitations: [],
    parqFlag: false,
    weeklyTargetKg: 0.5,
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const toggleLimit = (v) => {
    setForm((f) => {
      const cur = f.limitations || []
      return { ...f, limitations: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }
    })
  }

  // 大体重基数自动提示周减重安全上限（与营养引擎的 safeRatePct 保持一致）
  const bmi = (() => {
    const m = form.heightCm / 100
    return m > 0 ? form.startWeight / (m * m) : 0
  })()
  const safeMax = bmi >= 30 ? 1.0 : bmi >= 28 ? 0.8 : bmi >= 25 ? 0.7 : 0.5

  const valid =
    form.age >= 14 && form.age <= 90 &&
    form.heightCm >= 130 && form.heightCm <= 220 &&
    form.startWeight > 30 && form.targetWeight > 30 &&
    form.targetWeight < form.startWeight

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="card">
        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-600">FatLoss Guardian</div>
        <h1 className="text-2xl font-extrabold tracking-tight">建立你的专属减重档案</h1>
        <p className="mt-1 text-sm text-slate-500">
          数据仅保存在本机浏览器（localStorage），不上传任何服务器。填写后将自动生成个性化热量、营养素与训练计划。
        </p>

        {/* ============ 基本资料 ============ */}
        <div className="mt-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">基本资料</div>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">昵称（可选）</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="怎么称呼你" />
          </div>
          <div>
            <label className="label">生理性别（用于热量公式）</label>
            <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div>
            <label className="label">年龄</label>
            <input className="input" type="number" value={form.age} onChange={(e) => set('age', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">身高（cm）</label>
            <input className="input" type="number" value={form.heightCm} onChange={(e) => set('heightCm', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">当前体重（kg）</label>
            <input className="input" type="number" step="0.1" value={form.startWeight} onChange={(e) => set('startWeight', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">目标体重（kg）</label>
            <input className="input" type="number" step="0.1" value={form.targetWeight} onChange={(e) => set('targetWeight', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">日常活动量</label>
            <select className="input" value={form.activity} onChange={(e) => set('activity', Number(e.target.value))}>
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">可用器械</label>
            <select className="input" value={form.equipment} onChange={(e) => set('equipment', e.target.value)}>
              <option value="none">无器械（居家徒手）</option>
              <option value="dumbbell">哑铃（家庭训练）</option>
              <option value="gym">固定器械 / 健身房</option>
            </select>
          </div>
        </div>

        {/* ============ 运动能力（v3 核心） ============ */}
        <div className="mt-7 flex items-center gap-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">运动能力</div>
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold text-slate-400">决定动作难度，请如实填写</span>
        </div>

        <div className="mt-3">
          <label className="label">你目前的运动水平</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LEVEL_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set('trainingLevel', o.value)}
                className={`rounded-xl border px-3.5 py-2.5 text-left transition ${
                  form.trainingLevel === o.value
                    ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`text-sm font-bold ${form.trainingLevel === o.value ? 'text-indigo-700' : 'text-slate-700'}`}>{o.label}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{o.hint}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-slate-600">
            <b>{LEVEL_OPTIONS.find((o) => o.value === form.trainingLevel)?.label}</b> 的判定参考：{LEVEL_DESC[form.trainingLevel]}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">每周可训练天数</label>
            <select className="input" value={form.weeklyDays} onChange={(e) => set('weeklyDays', Number(e.target.value))}>
              {[2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>{d} 天</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">单次可投入时长</label>
            <select className="input" value={form.sessionMinutes} onChange={(e) => set('sessionMinutes', Number(e.target.value))}>
              {SESSION_MINUTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="label">伤病 / 受限情况（可多选，没有就不选）</label>
          <div className="flex flex-wrap gap-2">
            {LIMITATION_OPTIONS.map((o) => {
              const on = (form.limitations || []).includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleLimit(o.value)}
                  title={o.hint}
                  className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${
                    on ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {on ? '✓ ' : ''}{o.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">勾选后引擎会直接排除刺激该部位的动作（不是降级使用），并给出替代动作。</p>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-amber-600"
            checked={form.parqFlag}
            onChange={(e) => set('parqFlag', e.target.checked)}
          />
          <span className="text-[12px] leading-relaxed text-amber-900">
            <b>健康筛查（PAR-Q）</b>：医生是否曾告知我有心脏问题、只能参加医生推荐的体力活动？近期运动时是否出现过胸痛或不明原因的眩晕、晕厥？
            勾选后计划会降到最低强度，但请先完成医学评估再开始训练。
          </span>
        </label>

        {/* ============ 减重节奏 ============ */}
        <div className="mt-7 text-[11px] font-bold uppercase tracking-widest text-slate-400">减重节奏</div>
        <div className="mt-2">
          <label className="label">期望的每周减重速度</label>
          <select className="input" value={form.weeklyTargetKg} onChange={(e) => set('weeklyTargetKg', Number(e.target.value))}>
            {WEEKLY_LOSS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {form.weeklyTargetKg > safeMax && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-800">
              按你当前的体重与身高，安全上限约为 <b>每周 {safeMax} kg</b>（约 {Math.round((safeMax / form.startWeight) * 1000) / 10}% 体重）。
              你选的 {form.weeklyTargetKg} kg 会被引擎自动校正 —— 追速度掉的主要是水分与肌肉，而且很容易反弹。
            </p>
          )}
        </div>

        <div className="mt-4">
          <label className="label">饮食偏好</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['balanced', '均衡饮食'],
              ['lowcarb', '低碳饮食'],
              ['highprotein', '高蛋白饮食'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => set('diet', v)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  form.diet === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {!valid && <p className="mt-3 text-xs font-semibold text-rose-600">请检查输入：目标体重需小于当前体重，数值需在合理范围内。</p>}

        <button className="btn-primary mt-6 w-full !py-3" disabled={!valid} onClick={() => onSubmit(form)}>
          生成我的减重计划 →
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-400">热量估算采用 Mifflin-St Jeor 公式 · 不构成医疗建议</p>
      </div>
    </div>
  )
}
