import React from 'react'
import { ACTIVITY_LEVELS } from '../lib/plan'

// 首次使用引导：录入档案 → 生成计划 → 自动初始化防反弹区间
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
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

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

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="sm:col-span-2">
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
