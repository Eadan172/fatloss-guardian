import React from 'react'
import {
  initialState, loadState, saveState, clearState, exportJSON, validateImport,
} from './lib/storage'
import { restoreFromServerBackup, scheduleServerBackup, writeServerBackup } from './lib/autobackup'
import { generatePlan } from './lib/plan'
import { todayStr } from './lib/date'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import PlanView from './components/PlanView'
import CheckInForm from './components/CheckInForm'
import ReviewView from './components/ReviewView'
import SettingsView from './components/SettingsView'

const TABS = [
  ['dashboard', '仪表盘'],
  ['plan', '我的计划'],
  ['checkin', '打卡'],
  ['review', '周期复盘'],
  ['settings', '设置'],
]

export default function App() {
  const [state, setState] = React.useState(() => loadState() || initialState())
  const [tab, setTab] = React.useState('dashboard')
  const [toast, setToast] = React.useState('')
  const today = todayStr()

  // 任何状态变化即时持久化到本机（localStorage + 本机备份文件，后者静态部署下静默跳过）
  React.useEffect(() => {
    saveState(state)
    scheduleServerBackup(state)
  }, [state])

  // 首次打开且本机无档案时，尝试从本机备份文件（data/backup.json）自动恢复
  const restoreTried = React.useRef(false)
  React.useEffect(() => {
    if (restoreTried.current) return
    restoreTried.current = true
    if (state.profile) return
    restoreFromServerBackup().then((r) => {
      if (r?.profile) {
        setState(r)
        notify('✓ 已从本机备份文件自动恢复数据')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const notify = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  // 建档：生成计划 + 自动初始化防反弹区间（目标体重 ±2 kg，预警线 上限+1）
  const handleOnboard = (profile) => {
    const plan = generatePlan(profile)
    setState((s) => ({
      ...s,
      profile,
      plan,
      settings: {
        ...s.settings,
        safeZoneLow: Math.round((profile.targetWeight - 2) * 10) / 10,
        safeZoneHigh: Math.round((profile.targetWeight + 2) * 10) / 10,
        reboundLine: Math.round((profile.targetWeight + 3) * 10) / 10,
      },
    }))
    notify('✓ 计划已生成，防反弹区间已自动初始化')
  }

  const handleCheckin = (date, form) => {
    setState((s) => ({ ...s, checkins: { ...s.checkins, [date]: form } }))
  }

  const handleImport = (text) => {
    const r = validateImport(text)
    if (!r.ok) {
      notify(`✗ 导入失败：${r.error}`)
      return
    }
    setState(r.state)
    notify('✓ 备份已恢复')
  }

  const handleReset = () => {
    clearState()
    const empty = initialState()
    writeServerBackup(empty) // 立即覆盖本机备份文件，避免下次打开被自动恢复
    setState(empty)
    setTab('dashboard')
    notify('已清空，可重新建档')
  }

  const hasProfile = !!state.profile && !!state.plan

  return (
    <div className="min-h-screen">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-base text-white shadow-sm">⚖️</div>
            <div>
              <div className="text-[15px] font-extrabold leading-tight tracking-tight">减重守护台</div>
              <div className="text-[10px] font-semibold text-slate-400">本地优先 · 零网络传输{state.profile?.name ? ` · ${state.profile.name}` : ''}</div>
            </div>
          </div>
          {hasProfile && (
            <nav className="ml-auto flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
              {TABS.map(([k, l]) => (
                <button key={k} className={`tab-btn ${tab === k ? 'tab-btn-active' : ''}`} onClick={() => setTab(k)}>
                  {l}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!hasProfile ? (
          <Onboarding onSubmit={handleOnboard} />
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard state={state} today={today} />}
            {tab === 'plan' && (
              <PlanView
                plan={state.plan}
                profile={state.profile}
                courses={state.courses}
                onUpdateCourses={(courses) => setState((s) => ({ ...s, courses }))}
                onRegenerate={() => handleOnboard(state.profile)}
              />
            )}
            {tab === 'checkin' && <CheckInForm checkins={state.checkins} plan={state.plan} courses={state.courses} onSave={handleCheckin} />}
            {tab === 'review' && <ReviewView checkins={state.checkins} plan={state.plan} settings={state.settings} today={today} />}
            {tab === 'settings' && (
              <SettingsView
                state={state}
                onUpdateSettings={(patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))}
                onImport={handleImport}
                onReset={handleReset}
                onExport={() => exportJSON(state)}
              />
            )}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-[11px] text-slate-400">
        数据仅存于本机浏览器 localStorage · 请在「设置」中定期导出 JSON 备份 · 本工具不构成医疗建议
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
