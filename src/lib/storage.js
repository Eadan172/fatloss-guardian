// 本地存储层：单一 localStorage key，零网络传输。
// 导出/导入为完整 JSON 快照，支持跨设备无损迁移。
const KEY = 'fatloss.guardian.v1'
export const SCHEMA_VERSION = 2

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
  completedCourses: [], // 当日已完成的课程库课程 id
}

export function initialState() {
  return {
    version: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    profile: null, // { name, gender, age, heightCm, startWeight, targetWeight, activity, equipment, diet }
    plan: null,    // 由 lib/plan.js 生成
    checkins: {},  // { 'YYYY-MM-DD': {weight, calories, ..., note, completedCourses} }
    courses: [],   // 运动课程库：[{ id, name, app: 'keep'|'boohee'|'other', minutes, weekday: 0-6, link }]
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

function migrate(s) {
  const base = initialState()
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...(s.settings || {}) },
    checkins: s.checkins || {},
    courses: Array.isArray(s.courses) ? s.courses : [],
  }
}

// ---- JSON 导出 / 导入 ----
export function exportJSON(state) {
  const payload = { app: 'fatloss-guardian', exportedAt: new Date().toISOString(), data: state }
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
