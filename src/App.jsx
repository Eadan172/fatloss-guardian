import React from 'react'
import {
  initialState, loadState, saveState, clearState, exportJSON, validateImport,
  normalizeProfile, needsPlanRebuild,
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

// 当前体重：取打卡记录里最近一次 > 0 的体重，否则退回档案起始体重
function currentWeightOf(state) {
  const c = state?.checkins || {}
  const keys = Object.keys(c).sort()
  for (let i = keys.length - 1; i >= 0; i--) {
    const w = Number(c[keys[i]].weight)
    if (w > 0) return w
  }
  return state?.profile ? state.profile.startWeight : null
}

// 档案补全 + 计划重建（幂等：不需要重建时原样返回）
// 用于两处：启动时载入本地数据；从本机备份文件恢复后。
function ensurePlan(state) {
  if (!needsPlanRebuild(state) || !state.profile) return { state, rebuilt: false }
  const profile = normalizeProfile(state.profile)
  const plan = generatePlan(profile, currentWeightOf(state))
  return { state: { ...state, profile, plan }, rebuilt: true }
}

function bootState() {
  return ensurePlan(loadState() || initialState())
}

export default function App() {
  const [boot] = React.useState(bootState)
  const [state, setState] = React.useState(boot.state)
  const [tab, setTab] = React.useState('dashboard')
  const [toast, setToast] = React.useState(
    boot.rebuilt ? '✓ 已按你的运动水平重建训练计划' : '',
  )
  const today = todayStr()

  // 任何状态变化即时持久化到本机（localStorage + 本机备份文件）
  // 仅建档后才写备份文件：避免空状态覆盖已有备份（清空数据走 handleReset 显式清除）
  //
  // 与「启动快照」一致的 state 不回写备份文件：否则换一个浏览器 / 换一台设备打开时，
  // 那个浏览器里陈旧或为空的 localStorage 会立刻覆盖 data/backup.json，抹掉另一处的数据。
  // 只有本次会话真正改动过数据（建档 / 打卡 / 改设置 / 重新生成计划）才会回写。
  const bootSnapshot = React.useRef(JSON.stringify(boot.state))
  React.useEffect(() => {
    saveState(state)
    if (!state.profile) return
    if (JSON.stringify(state) === bootSnapshot.current) return
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
        const fixed = ensurePlan(r)
        setState(fixed.state)
        notify(fixed.rebuilt ? '✓ 已从本机备份恢复，并按运动水平重建计划' : '✓ 已从本机备份文件自动恢复数据')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 3600)
    return () => clearTimeout(t)
  }, [toast])

  const notify = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  // 只重建计划，不动防反弹区间与课程库（避免覆盖用户手工调过的值）
  const rebuildPlan = (profile, extraSettings) => {
    const p = normalizeProfile(profile)
    setState((s) => ({
      ...s,
      profile: p,
      plan: generatePlan(p, currentWeightOf(s)),
      settings: extraSettings ? { ...s.settings, ...extraSettings } : s.settings,
    }))
  }

  // 建档：生成计划 + 自动初始化防反弹区间（目标体重 ±2 kg，预警线 上限+1）
  const handleOnboard = (profile) => {
    const p = normalizeProfile({ ...profile, createdAt: new Date().toISOString() })
    rebuildPlan(p, {
      safeZoneLow: Math.round((p.targetWeight - 2) * 10) / 10,
      safeZoneHigh: Math.round((p.targetWeight + 2) * 10) / 10,
      reboundLine: Math.round((p.targetWeight + 3) * 10) / 10,
    })
    notify('✓ 计划已生成，防反弹区间已自动初始化')
  }

  // 在计划页调整训练设置（水平 / 频率 / 时长）后重新生成
  const handleUpdateTraining = (patch) => {
    rebuildPlan({ ...state.profile, ...patch })
    notify('✓ 已按新的训练设置重新生成计划')
  }

  const handleRegenerate = () => {
    rebuildPlan(state.profile)
    notify('✓ 计划已按当前体重重新生成')
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
    const fixed = ensurePlan(r.state)
    setState(fixed.state)
    notify(fixed.rebuilt ? '✓ 备份已恢复，并按运动水平重建计划' : '✓ 备份已恢复')
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
              <div className="text-[10px] font-semibold text-slate-400">
                本地优先 · 零网络传输{state.profile?.name ? ` · ${state.profile.name}` : ''}
                {state.profile?.trainingLevel ? ` · ${state.profile.trainingLevel.toUpperCase()}` : ''}
              </div>
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
                onUpdateTraining={handleUpdateTraining}
                onRegenerate={handleRegenerate}
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
