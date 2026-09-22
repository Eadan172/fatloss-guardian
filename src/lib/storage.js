// 本地存储层：单一 localStorage key，零网络传输。
// 导出/导入为完整 JSON 快照，支持跨设备无损迁移。
//
// v2 → v3 的关键变化：档案新增「运动水平 / 每周频率 / 单次时长 / 伤病限制 / PAR-Q / 每周减重目标」。
// v2 及更早的档案没有这些字段，迁移时一律按最保守口径补齐（K1 + 每周 3 练 + 30 分钟 + 无伤病限制），
// 并强制重建计划 —— 因为旧计划是用「只看器械、不看水平」的逻辑生成的，对零基础用户难度过高。
import { profileSignature, PLAN_VERSION } from './plan.js'

const KEY = 'fatloss.guardian.v1'

// v2 = 运动课程库；v3 = 训练水平档案
export const SCHEMA_VERSION = 3

export const EMPTY_CHECKIN = {
  weight: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  water: '',
  sleepHours: '',
  workoutDone: false,
  workoutMinutes: '',
  stress: 3,
  note: '',
  planType: 'platform', // 当日锻炼方案：platform=平台生成 / app=运动软件跟课
  completedCourses: [], // 当日已完成的课程库课程 id
}

// 档案字段的权威定义（含 v3 新增字段）
export const PROFILE_DEFAULTS = {
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
  trainingLevel: 'k1',   // 运动水平：k1 / k2 / k3 / k4
  weeklyDays: 3,         // 期望每周训练天数（2–5）
  sessionMinutes: 30,    // 单次可投入时长（20 / 30 / 45 / 60）
  limitations: [],       // 伤病与受限标签
  parqFlag: false,       // PAR-Q 安全筛查是否出现阳性项
  weeklyTargetKg: 0.5,   // 期望每周减重（引擎会按体重百分比自动校正）
  createdAt: '',         // 建档时间（用于推进 7 周训练循环）
}

const LEVELS = ['k1', 'k2', 'k3', 'k4']
const ALL_LIMITATIONS = ['knee', 'lowback', 'shoulder', 'wrist', 'ankle', 'cardio', 'balance']

// 把任意版本的档案补齐成合法的 v3 档案
export function normalizeProfile(raw) {
  if (!raw || typeof raw !== 'object') return null
  const p = { ...PROFILE_DEFAULTS, ...raw }

  p.trainingLevel = LEVELS.includes(p.trainingLevel) ? p.trainingLevel : 'k1'
  p.weeklyDays = Math.min(5, Math.max(2, Math.round(Number(p.weeklyDays) || 3)))
  p.sessionMinutes = [20, 30, 45, 60].includes(Number(p.sessionMinutes)) ? Number(p.sessionMinutes) : 30
  p.limitations = Array.isArray(p.limitations)
    ? p.limitations.filter((l) => ALL_LIMITATIONS.includes(l))
    : []
  p.parqFlag = !!p.parqFlag
  p.weeklyTargetKg = Number(p.weeklyTargetKg) > 0 ? Number(p.weeklyTargetKg) : 0.5
  p.diet = ['balanced', 'lowcarb', 'highprotein'].includes(p.diet) ? p.diet : 'balanced'
  p.equipment = ['none', 'dumbbell', 'gym'].includes(p.equipment) ? p.equipment : 'none'
  p.createdAt = p.createdAt || new Date().toISOString()

  return p
}

export function initialState() {
  return {
    version: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    profile: null, // 见 PROFILE_DEFAULTS
    plan: null,    // 由 lib/plan.js 生成
    checkins: {},  // { 'YYYY-MM-DD': {weight, calories, ..., note, completedCourses} }
    courses: [],   // 运动课程库：[{ id, name, app, customApp, minutes, date, link }]
    settings: {
      safeZoneLow: 0,   // 安全体重区间下限 kg
      safeZoneHigh: 0,  // 安全体重区间上限 kg
      reboundLine: 0,   // 反弹预警线 kg（7日均线触及即报警）
      waterGoal: 8,     // 每日饮水目标（杯）
      sleepGoal: 7.5,   // 每日睡眠目标（小时）
    },
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    return migrate(s)
  } catch {
    return null
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearState() {
  localStorage.removeItem(KEY)
}

// 旧版课程按「星期」安排 → 迁移为该星期自今天起最近一次出现的具体日期
function migrateCourse(c) {
  if (c && !c.date && c.weekday != null) {
    const d = new Date()
    d.setDate(d.getDate() + ((Number(c.weekday) - d.getDay() + 7) % 7))
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return { ...c, date: `${y}-${m}-${day}` }
  }
  return c
}

export function migrate(s) {
  const base = initialState()
  return {
    ...base,
    ...s,
    version: SCHEMA_VERSION,
    profile: normalizeProfile(s && s.profile),
    plan: (s && s.plan) || null,
    settings: { ...base.settings, ...((s && s.settings) || {}) },
    checkins: (s && s.checkins) || {},
    courses: Array.isArray(s && s.courses) ? s.courses.map(migrateCourse) : [],
  }
}

// 计划是否需要重建：
//   1) 没有计划
//   2) 计划是旧结构（旧逻辑只看器械、不看运动水平）
//   3) 档案的关键字段变了（例如用户把水平从 K3 改成 K1）
export function needsPlanRebuild(state) {
  if (!state || !state.profile) return false
  const plan = state.plan
  if (!plan) return true
  if (plan.version !== PLAN_VERSION) return true
  if (plan.builtFrom !== profileSignature(state.profile)) return true
  return false
}

// ---- JSON 导出 / 导入 ----
export function exportJSON(state) {
  const payload = {
    app: 'fatloss-guardian',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const d = new Date()
  a.href = url
  a.download = `fatloss-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 校验导入文件，返回 { ok, state?, error? }
export function validateImport(text) {
  let obj
  try {
    obj = JSON.parse(text)
  } catch {
    return { ok: false, error: '文件不是合法的 JSON' }
  }
  const data = obj && obj.data ? obj.data : obj
  if (!data || typeof data !== 'object') return { ok: false, error: '文件结构不正确' }
  if (data.checkins && typeof data.checkins !== 'object') return { ok: false, error: 'checkins 字段格式错误' }
  if (data.profile && typeof data.profile !== 'object') return { ok: false, error: 'profile 字段格式错误' }
  if (data.courses && !Array.isArray(data.courses)) return { ok: false, error: 'courses 字段格式错误' }
  return { ok: true, state: migrate(data) }
}
