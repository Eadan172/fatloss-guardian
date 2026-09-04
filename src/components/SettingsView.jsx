import React from 'react'

// 设置：防反弹区间 + 目标 + JSON 备份/恢复 + 危险区
export default function SettingsView({ state, onUpdateSettings, onImport, onReset, onExport }) {
  const s = state.settings
  const [form, setForm] = React.useState({
    safeZoneLow: s.safeZoneLow,
    safeZoneHigh: s.safeZoneHigh,
    reboundLine: s.reboundLine,
    waterGoal: s.waterGoal,
    sleepGoal: s.sleepGoal,
  })
  const [msg, setMsg] = React.useState('')
  const fileRef = React.useRef(null)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    if (form.safeZoneLow > 0 && form.safeZoneHigh > 0 && form.safeZoneLow >= form.safeZoneHigh) {
      setMsg('区间下限必须小于上限')
      return
    }
    if (form.reboundLine > 0 && form.safeZoneHigh > 0 && form.reboundLine <= form.safeZoneHigh) {
      setMsg('反弹预警线应高于区间上限（预警线 = 需要立即纠偏的临界值）')
      return
    }
    onUpdateSettings(form)
    setMsg('✓ 设置已保存')
    setTimeout(() => setMsg(''), 2000)
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    onImport(text)
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <h3 className="text-lg font-extrabold tracking-tight">防反弹监控</h3>
        <p className="mt-1 text-sm text-slate-500">
          判定依据是 <b>7 日体重均线</b>（过滤单日水分波动）。进入维持期后，建议把区间设为目标体重 ±2 kg，预警线设在上限 +1 kg。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <label className="label">区间下限 (kg)</label>
            <input className="input" type="number" step="0.1" value={form.safeZoneLow} onChange={(e) => set('safeZoneLow', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">区间上限 (kg)</label>
            <input className="input" type="number" step="0.1" value={form.safeZoneHigh} onChange={(e) => set('safeZoneHigh', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">反弹预警线 (kg)</label>
            <input className="input" type="number" step="0.1" value={form.reboundLine} onChange={(e) => set('reboundLine', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">饮水目标（杯/天）</label>
            <input className="input" type="number" min="1" value={form.waterGoal} onChange={(e) => set('waterGoal', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">睡眠目标（小时）</label>
            <input className="input" type="number" step="0.5" min="4" value={form.sleepGoal} onChange={(e) => set('sleepGoal', Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" onClick={save}>保存设置</button>
          {msg && <span className={`text-sm font-semibold ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{msg}</span>}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-extrabold tracking-tight">数据备份与迁移</h3>
        <p className="mt-1 text-sm text-slate-500">
          所有数据仅存于本机 localStorage，<b>不发生任何网络传输</b>。换设备 / 换浏览器时，导出 JSON 再导入即可无损迁移。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={onExport}>⬇ 导出完整备份（JSON）</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>⬆ 导入恢复备份</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          当前数据：打卡 {Object.keys(state.checkins).length} 天 · 建议每周导出一次备份
        </p>
      </div>

      <div className="card border-rose-200">
        <h3 className="text-lg font-extrabold tracking-tight text-rose-700">危险区</h3>
        <p className="mt-1 text-sm text-slate-500">清空本机全部数据（档案、计划、打卡记录、设置）。此操作不可恢复，请先导出备份。</p>
        <button
          className="btn-danger mt-4"
          onClick={() => {
            if (window.confirm('确定要清空全部本地数据吗？此操作不可恢复！')) onReset()
          }}
        >
          清空全部数据
        </button>
      </div>
    </div>
  )
}
