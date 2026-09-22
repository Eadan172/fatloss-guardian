// ===================== 训练引擎 =====================
// 输入：profile（含 trainingLevel / weeklyDays / sessionMinutes / limitations / parqFlag）+ BMI
// 输出：与用户真实水平匹配的 7 天周计划 + 处方 + 进阶路线 + 安全说明
//
// 编排原则（按优先级）：
//   1. 安全闸门：PAR-Q / 伤病标签 / 年龄 / 体重基数 → 决定可用的最大关节冲击
//   2. 水平闸门：minLevel ≤ 用户水平 → 决定动作池上限（K1 用户拿不到 K3 动作）
//   3. 器械闸门：只用用户真正拥有的器械（健身房用户隐含拥有哑铃）
//   4. 结构：先固定三大基础模式（蹲 / 推 / 拉），再按训练日轮换补充，保证一周内全身覆盖
//   5. 渐进：7 周一个循环（适应 → 建立 → 加强 → 减载），初学者优先加「组数」而非追重量
//
// 为什么 K1 要「少而重复」：初学者最大的收益来自动作模式学习，而不是动作花样。
// 因此 K1 的 A / B / C 三个训练日刻意使用同一组基础动作，只轮换补充动作。

import {
  EXERCISES, IMPACT_ORDER, LEVEL_ORDER, LEVEL_LABEL, LEVEL_DESC, PATTERN_LABEL,
  canUseEquipment, isBlocked, LIMITATION_LABEL,
} from './exerciseLibrary.js'

export { LEVEL_LABEL, LEVEL_DESC, LIMITATION_LABEL }

// ---------------- 训练频率上限 ----------------
// 即便用户勾了 5 天，K1 的力量日也封顶 3 天：多余天数转为低强度有氧，
// 既满足「多动」的诉求，又不会让新手在关节与神经层面过载。
const STRENGTH_DAYS_CAP = { k1: 3, k2: 4, k3: 4, k4: 5 }

// ---------------- 单次动作数量 ----------------
const EXERCISE_CAP = { k1: 4, k2: 5, k3: 6, k4: 6 }
function countByMinutes(min) {
  if (min <= 20) return 3
  if (min <= 30) return 4
  if (min <= 45) return 5
  return 6
}

// ---------------- 处方（组数 / 次数 / 休息 / 强度） ----------------
// 强度用 RIR（还剩几次余力）与 RPE（主观用力程度）双重表述，这是新手最容易理解的强度语言。
// 减脂期的铁律：任何动作都不做到力竭 —— 力竭会显著延长恢复、抬高食欲，得不偿失。
const LEVEL_RX = {
  // K1 = 主流健身 App K1 口径：2–3 组 × 8–15 次，组间 60–90 秒，单次 20–30 分钟，全程留 3 次余力
  k1: {
    setsCompound: 3, setsIsolation: 3, repsCompound: [8, 12], repsIsolation: [12, 15],
    timedSec: 20, restCompound: 75, restIsolation: 60, rir: 3,
    rpe: '4–6', rpeDesc: '轻到中等，全程能正常说话', maxSets: 3,
    warmupMin: 5, cooldownMin: 5, cardioMin: 20, cardioRpe: '4–5（能说话但唱不了歌）',
  },
  k2: {
    setsCompound: 3, setsIsolation: 3, repsCompound: [10, 12], repsIsolation: [12, 15],
    timedSec: 30, restCompound: 70, restIsolation: 55, rir: 2,
    rpe: '5–7', rpeDesc: '有点吃力，但还能再完成 2 次', maxSets: 3,
    warmupMin: 5, cooldownMin: 5, cardioMin: 25, cardioRpe: '4–6',
  },
  k3: {
    setsCompound: 4, setsIsolation: 3, repsCompound: [8, 12], repsIsolation: [12, 15],
    timedSec: 45, restCompound: 90, restIsolation: 60, rir: 2,
    rpe: '7–8', rpeDesc: '吃力，最后一组接近但不到力竭', maxSets: 4,
    warmupMin: 6, cooldownMin: 5, cardioMin: 30, cardioRpe: '5–7',
  },
  k4: {
    setsCompound: 4, setsIsolation: 3, repsCompound: [6, 10], repsIsolation: [10, 15],
    timedSec: 60, restCompound: 120, restIsolation: 75, rir: 1,
    rpe: '8–9', rpeDesc: '最后一组留 1 次余力', maxSets: 5,
    warmupMin: 8, cooldownMin: 5, cardioMin: 35, cardioRpe: '6–8',
  },
}

// ---------------- 周期阶段（7 周一个循环） ----------------
function phaseForCycleWeek(c) {
  if (c <= 2) {
    return {
      name: '适应期', cycleWeek: c, setsDelta: -1, repDelta: 0, deload: false,
      desc: '每个动作少做一组，把注意力全部放在动作轨迹和呼吸上。这个阶段的目标不是练到累，而是让身体学会动作、让关节适应负荷。',
      focus: '学动作、建立习惯，练完应该感觉「还能再来一组」',
    }
  }
  if (c <= 4) {
    return {
      name: '建立期', cycleWeek: c, setsDelta: 0, repDelta: 0, deload: false,
      desc: '组数加到标准量，用统一节奏完成（下放约 2 秒、举起约 1 秒）。如果最后一组能轻松超出次数上限，说明可以进入加强期。',
      focus: '稳定输出标准组数，动作质量优先于次数',
    }
  }
  if (c <= 6) {
    return {
      name: '加强期', cycleWeek: c, setsDelta: 0, repDelta: 2, deload: false,
      desc: '次数上限上调 2 次（器械用户可小幅加重量）。这是本循环强度最高的一段，睡眠和蛋白质一定要跟上。',
      focus: '次数上限 +2，或换更难的动作变式',
    }
  }
  return {
    name: '减载周', cycleWeek: c, setsDelta: -1, repDelta: 0, deload: true,
    desc: '刻意减量的一周：组数减 1，强度降到 RPE 5 左右。减载不是偷懒，是让身体把前几周积累的适应真正兑现成力量。',
    focus: '主动减量，让恢复追上来',
  }
}

// ---------------- 周计划结构 ----------------
const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 训练日排布：保证训练日之间至少间隔 1 天（K1 / K2 尤为关键）
const TRAINING_DAY_INDEX = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
}

const SESSION_TITLE = {
  full: '全身训练', upper: '上肢训练', lower: '下肢训练', push: '推类训练',
  pull: '拉类训练', legs: '腿部训练', cardio: '低强度有氧',
  recovery: '主动恢复', rest: '完全休息',
}

const SESSION_SLOTS = {
  full: ['squat', 'push_h', 'pull_h', 'hinge', 'core'],
  upper: ['push_h', 'pull_h', 'push_v', 'pull_v', 'arms', 'core'],
  lower: ['squat', 'hinge', 'glute', 'calf', 'core'],
  push: ['push_h', 'push_v', 'pull_h', 'arms', 'core'],
  pull: ['pull_h', 'pull_v', 'pull_h', 'arms', 'core'],
  legs: ['squat', 'hinge', 'glute', 'calf', 'core'],
  cardio: [],
  recovery: [],
  rest: [],
}

// 全身训练日固定保留的三大基础模式（蹲 / 水平推 / 水平拉）
const FULL_FIXED = ['squat', 'push_h', 'pull_h']
// 其余槽位按训练日轮换，保证一周内覆盖后链、核心、臀、小腿、手臂
const FULL_ROTATION = ['hinge', 'core', 'glute', 'hinge', 'core', 'calf', 'arms']
// 单次只有 3 个动作时，固定槽位降为「蹲 + 推」，第三格优先补拉，避免拉类整周缺席
const FULL_ROTATION_SMALL = ['pull_h', 'hinge', 'core', 'glute', 'hinge', 'core', 'calf', 'arms']

const COMPOUND = ['squat', 'hinge', 'push_h', 'push_v', 'pull_h', 'pull_v']
const CORE_PATTERNS = ['squat', 'hinge', 'push_h', 'push_v', 'pull_h', 'pull_v', 'core', 'glute', 'arms', 'calf']

// ---------------- 安全闸门 ----------------
const EXCLUDE_DESC = {
  knee: '跳跃类、深蹲到底、弓步类动作',
  lowback: '大重量髋铰链、卷腹与仰卧举腿类动作',
  shoulder: '过顶推举与大幅度肩外展动作',
  wrist: '手掌撑地类动作（俯卧撑 / 平板支撑 / 四足位）',
  ankle: '跳跃类动作与坡度过大的有氧',
  cardio: '高强度间歇、波比跳等大心肺负荷动作',
  balance: '无支撑的单腿动作',
}

// 依据 PAR-Q、伤病、年龄、体重基数推导允许的最大关节冲击
//
// 关键区分：这里管的是「落地冲击」（跳跃、冲刺、跳绳），不是「脊柱负荷」。
// 杠铃深蹲 / 硬拉被标为 mid，但它们没有落地冲击，风险由「水平」与「腰椎禁忌」来管。
// 因此体重基数对 K3 / K4 用户只压到 mid（排除跳跃，保留自由重量复合动作）——
// 一个系统训练一年以上、BMI 29 的人，本来就在做杠铃深蹲，App 不该把他的主项拿走。
export function maxImpact(p, bmi) {
  const lims = p.limitations || []
  const hardLow = ['knee', 'ankle', 'cardio']
  const experienced = p.trainingLevel === 'k3' || p.trainingLevel === 'k4'

  let cap = 'high'
  if (p.age >= 55) cap = 'mid'
  if (bmi >= 25) cap = 'mid'
  if (bmi >= 28) cap = experienced ? 'mid' : 'low'

  if (lims.some((l) => hardLow.includes(l))) cap = 'low'
  if (p.parqFlag) cap = 'low'
  // 核心修正：K1 一律只给低冲击动作。零基础用户的关节、肌腱与心肺都还没适应冲击负荷，
  // 这个阶段安排跳跃动作的受伤风险远大于收益。
  if (p.trainingLevel === 'k1') cap = 'low'

  return cap
}

function equipWeight(ex) {
  if (ex.equip.includes('gym')) return 3
  if (ex.equip.includes('dumbbell')) return 2
  return 1
}

// 各动作模式下的「主项动作」。排序时主项优先，避免孤立动作抢到主项槽位
// （例如绳索夹胸挤掉哑铃卧推）。
const MAIN_LIFTS = new Set([
  // 蹲
  'chair_squat', 'bw_squat', 'db_goblet_squat', 'leg_press', 'smith_squat', 'barbell_squat', 'db_thruster',
  // 髋主导
  'glute_bridge', 'db_glute_bridge', 'db_rdl', 'db_sldl', 'leg_curl', 'barbell_deadlift',
  // 水平推
  'wall_pushup', 'incline_pushup', 'knee_pushup', 'pushup',
  'db_floor_press', 'db_bench_press', 'db_incline_press', 'machine_chest_press', 'barbell_bench',
  // 垂直推
  'pike_pushup', 'db_ohp', 'machine_shoulder_press',
  // 水平拉
  'towel_row', 'table_row', 'machine_row', 'db_one_arm_row', 'db_bent_row', 'cable_row', 'barbell_row',
  // 垂直拉
  'lat_pulldown', 'assisted_pullup', 'pullup',
  // 臀 / 核心 / 手臂
  'single_leg_bridge', 'hip_thrust_machine', 'plank_knee', 'plank', 'dead_bug',
  'db_curl', 'cable_curl', 'cable_pushdown', 'calf_raise',
])

// ---------------- 动作池 ----------------
// 排序：水平档位从高到低（优先用「用户能力上限」的动作），
// 同档内主项动作优先，再优先器械更具体的动作，最后保留动作库原始顺序（由易到难）。
function buildPool(p, cap) {
  const lims = p.limitations || []
  return EXERCISES
    .filter((ex) => canUseEquipment(ex, p.equipment))
    .filter((ex) => LEVEL_ORDER[ex.minLevel] <= LEVEL_ORDER[p.trainingLevel])
    .filter((ex) => !isBlocked(ex, lims))
    .filter((ex) => ex.pattern === 'mobility' || IMPACT_ORDER[ex.impact] <= IMPACT_ORDER[cap])
    .sort((a, b) => {
      const lv = LEVEL_ORDER[b.minLevel] - LEVEL_ORDER[a.minLevel]
      if (lv !== 0) return lv
      const mn = (MAIN_LIFTS.has(b.id) ? 1 : 0) - (MAIN_LIFTS.has(a.id) ? 1 : 0)
      if (mn !== 0) return mn
      return equipWeight(b) - equipWeight(a)
    })
}

// ---------------- 处方格式化 ----------------
function fmtReps(r, delta) {
  return `${r[0] + delta}–${r[1] + delta}`
}
function clampSets(n, rx) {
  return Math.max(2, Math.min(rx.maxSets, n))
}
function baseSets(pat, rx) {
  return COMPOUND.includes(pat) ? rx.setsCompound : rx.setsIsolation
}
function timedFor(rx, phase) {
  return Math.max(15, rx.timedSec + phase.repDelta * 5)
}

function prescribe(ex, rx, phase, sets) {
  const out = {
    id: ex.id,
    label: ex.name,
    en: ex.en,
    name: `${ex.name}（${ex.en}）`,
    cues: ex.cues,
    kind: 'strength',
    sets: '',
    pattern: ex.pattern,
  }
  if (ex.alt) out.note = ex.alt

  if (ex.pattern === 'cardio') {
    out.kind = 'cardio'
    out.sets = `${rx.cardioMin} 分钟`
    out.note = ex.alt || `强度：${rx.cardioRpe}`
    return out
  }
  if (ex.pattern === 'mobility') {
    out.kind = 'mobility'
    out.sets = '30 秒 × 2'
    return out
  }
  if (ex.timed) {
    out.sets = `${sets} × ${timedFor(rx, phase)} 秒`
    return out
  }
  const reps = COMPOUND.includes(ex.pattern) ? rx.repsCompound : rx.repsIsolation
  out.sets = `${sets} × ${fmtReps(reps, phase.repDelta)}`
  return out
}

function exerciseMinutes(ex, rx, phase, sets) {
  const work = ex.timed ? timedFor(rx, phase) : 45
  const rest = COMPOUND.includes(ex.pattern) ? rx.restCompound : rx.restIsolation
  return (sets * (work + rest)) / 60
}

// ---------------- 选中动作 ----------------
function pick(pool, pattern, variant, used) {
  const cands = pool.filter((e) => e.pattern === pattern && !used.has(e.id))
  if (cands.length === 0) return null
  // 只在本档位（= 用户能力上限那一档）内轮换。
  // 这样既不会让 K2 用户被轮换回 K1 动作、K4 用户轮换掉复合大重量动作，
  // 又能在同难度档位内通过不同变式提供变化。
  const top = Math.max(...cands.map((e) => LEVEL_ORDER[e.minLevel]))
  const tier = cands.filter((e) => LEVEL_ORDER[e.minLevel] === top)
  return tier[variant % tier.length]
}

// ---------------- 热身 / 冷身 ----------------
const WARMUP_LOWER = ['march_in_place', 'hip_circle', 'ankle_mobility', 'hip_hinge_touch', 'glute_bridge', 'leg_swing']
const WARMUP_UPPER = ['march_in_place', 'arm_circle', 'wrist_circle', 'cat_cow', 'prone_y_raise', 'neck_shoulder_roll']
const COOLDOWN_UPPER = ['cat_cow', 'chest_opener', 'neck_shoulder_roll', 'child_pose', 'hip_flexor_stretch']
const COOLDOWN_LOWER = ['quad_stretch', 'hamstring_stretch', 'calf_stretch', 'glute_stretch', 'child_pose', 'hip_flexor_stretch']

function namesFromPool(pool, ids, take) {
  const available = ids.filter((id) => pool.some((e) => e.id === id))
  const src = available.length >= 3 ? available : available.concat(ids.filter((id) => !available.includes(id)))
  return src.slice(0, take).map((id) => {
    const ex = EXERCISES.find((e) => e.id === id)
    return ex ? ex.name : id
  })
}

// ---------------- 单日构建 ----------------
function buildStrengthDay(dayName, kind, title, pool, rx, phase, count, variant, p) {
  const used = new Set()
  const picks = []

  // K1：三大基础动作三天重复（服务动作模式学习）；K2+ 按训练日轮换增加变化
  const fixedVariant = p.trainingLevel === 'k1' ? 0 : variant

  const pushSlot = (pat, rot) => {
    if (picks.length >= count) return
    const ex = pick(pool, pat, rot, used)
    if (ex) { used.add(ex.id); picks.push(ex) }
  }

  // 槽位轮换规则：前两个槽位（主项 + 首要辅助）固定取 variant 0，
  // 只有第 3 个槽位之后的次要辅助位才随训练日轮换。
  // 这样既保证主项动作稳定出现（K4 的腿部日一定有杠铃深蹲、K2 的下肢日一定有哑铃硬拉），
  // 又能在次要动作上提供变化。
  const rotOf = (slotIndex, base) => (slotIndex >= 2 ? base : 0)

  if (kind === 'full') {
    // 动作数不足 4 个时固定槽位降为「蹲 + 推」，把第三格让给轮换槽
    const fixedCount = count >= 4 ? FULL_FIXED.length : 2
    FULL_FIXED.slice(0, fixedCount).forEach((pat, i) => pushSlot(pat, rotOf(i, fixedVariant)))
    const rotSrc = count >= 4 ? FULL_ROTATION : FULL_ROTATION_SMALL
    const step = count >= 4 ? 2 : 1
    Array.from({ length: rotSrc.length }, (_, k) => rotSrc[(variant * step + k) % rotSrc.length])
      .forEach((pat) => pushSlot(pat, variant))
  } else {
    SESSION_SLOTS[kind].forEach((pat, i) => pushSlot(pat, rotOf(i, variant)))
  }

  if (picks.length === 0) return null

  // 20 分钟档位把热身/冷身压到 3 分钟，否则热身会吃掉一半的时间预算
  const shortSession = p.sessionMinutes <= 20
  const wu = shortSession ? 3 : rx.warmupMin
  const cd = shortSession ? 3 : rx.cooldownMin

  // 组数分配与时长校验：组数会随阶段（加强期）上升，若估算时长超出用户声明的单次时长，
  // 先把靠后的动作逐级降到 2 组，仍超时才削减动作数 —— 优先保住动作模式覆盖。
  const budget = p.sessionMinutes + 5
  const chosen = picks.map((ex) => ({
    ex, sets: clampSets(baseSets(ex.pattern, rx) + phase.setsDelta, rx),
  }))
  const est = () => wu + cd
    + chosen.reduce((n, c) => n + exerciseMinutes(c.ex, rx, phase, c.sets), 0)
    + Math.max(0, chosen.length - 1) * 1.5

  for (let i = chosen.length - 1; i >= 1 && est() > budget; i--) {
    while (chosen[i].sets > 2 && est() > budget) chosen[i].sets -= 1
  }
  while (chosen.length > 3 && est() > budget) chosen.pop()

  const stdSets = clampSets(rx.setsCompound + phase.setsDelta, rx)
  const reduced = chosen.some((c) => c.sets < stdSets)
  const exercises = chosen.map((c) => prescribe(c.ex, rx, phase, c.sets))
  const total = est()

  const isLower = kind === 'lower' || kind === 'legs'
  const baseNote = phase.deload
    ? '本周为减载周：组数已自动减少，强度降到 RPE 5 左右，不要自行加量。'
    : p.trainingLevel === 'k1'
      ? `K1 阶段的最低完成线：每个动作只做 1 组也算今天完成。先保住频率，再谈强度。组间休息 ${rx.restCompound} 秒，所有动作都不做到力竭。`
      : `组间休息 ${rx.restCompound} 秒，孤立动作 ${rx.restIsolation} 秒。所有动作都不做到力竭（每组留 ${rx.rir} 次余力）。`
  const fitNote = reduced
    ? ` 为保证单次时长控制在 ${p.sessionMinutes} 分钟左右，靠后的动作已下调到 2 组 —— 这是刻意的取舍：优先保证「蹲 / 推 / 拉 / 后链 / 核心」都被练到，而不是把某一块练到极限。`
    : ''

  return {
    day: dayName,
    title,
    focus: picks.map((e) => e.name.split('（')[0]).join(' · '),
    exercises,
    warmup: namesFromPool(pool, isLower ? WARMUP_LOWER : WARMUP_UPPER, 4),
    cooldown: namesFromPool(pool, isLower ? COOLDOWN_LOWER : COOLDOWN_UPPER, 4),
    durationMin: Math.round(total),
    note: baseNote + fitNote,
  }
}

function buildCardioDay(dayName, pool, rx, p) {
  // 有氧日优先低冲击：K1 与体重基数大的用户不需要跳跃类来消耗热量
  const all = pool.filter((e) => e.pattern === 'cardio')
  const low = all.filter((e) => e.impact === 'low')
  const chosen = (low.length > 0 ? low : all)[0] || null
  const label = chosen && chosen.impact !== 'low' ? '中强度有氧' : '低强度有氧'

  const exercises = chosen
    ? [{
        id: chosen.id, label: chosen.name, en: chosen.en,
        name: `${chosen.name}（${chosen.en}）`,
        sets: `${rx.cardioMin} 分钟`,
        cues: chosen.cues,
        note: `强度：${rx.cardioRpe}`,
        kind: 'cardio', pattern: 'cardio',
      }]
    : [{
        id: 'walk', label: '快走', en: 'Brisk Walk', name: '快走（Brisk Walk）',
        sets: `${rx.cardioMin} 分钟`,
        cues: '步频加快、能说话但唱不了歌的强度。', kind: 'cardio', pattern: 'cardio',
      }]

  return {
    day: dayName,
    title: label,
    focus: chosen ? chosen.name : '快走',
    exercises,
    durationMin: rx.cardioMin + rx.warmupMin + 5,
    note: `${rx.warmupMin} 分钟慢速热身 → ${rx.cardioMin} 分钟正式有氧 → 5 分钟拉伸。中途拆成 2 段完成也算数，累计时长够即可${p.trainingLevel === 'k1' ? '；走完比走快更重要。' : '。'}`,
  }
}

function buildRecoveryDay(dayName, pool) {
  const moves = namesFromPool(pool, ['child_pose', 'chest_opener', 'hamstring_stretch', 'hip_flexor_stretch', 'neck_shoulder_roll', 'glute_stretch'], 3)
  return {
    day: dayName,
    title: '主动恢复',
    focus: '散步 + 拉伸',
    exercises: [
      { id: 'walk_recovery', label: '散步', name: '散步', sets: '20–30 分钟', cues: '轻松散步即可，目标是促进循环、缓解肌肉酸痛，不是消耗热量。', kind: 'cardio', pattern: 'cardio' },
      ...moves.map((m) => ({ id: m, label: m, name: m, sets: '30 秒 × 2', cues: '拉伸到有牵拉感即可，不要弹震。', kind: 'mobility', pattern: 'mobility' })),
    ],
    durationMin: 35,
    note: '恢复日不是训练日。如果你今天很想动，散步和拉伸就是正确的选择。',
  }
}

function buildRestDay(dayName) {
  return {
    day: dayName,
    title: '完全休息',
    isRest: true,
    focus: '睡眠与恢复',
    exercises: [
      { id: 'sleep', label: '保证 7–9 小时睡眠', name: '保证 7–9 小时睡眠', sets: '—', cues: '睡眠不足会让饥饿素上升约 15%，是减脂期最容易被忽视的变量。', kind: 'mobility', pattern: 'mobility' },
      { id: 'steps', label: '日常步数 6000 步以上', name: '日常步数 6000 步以上', sets: '—', cues: '非运动性活动消耗（NEAT）在减脂期占比很高，多走路比多练一组更划算。', kind: 'cardio', pattern: 'cardio' },
    ],
    durationMin: 0,
    note: '什么都不做也是计划的一部分。肌肉是在休息时长出来的。',
  }
}

// ---------------- 安全与透明化说明 ----------------
function buildSafetyNotes(p, bmi, strengthDays, pool) {
  const notes = []
  const lims = p.limitations || []

  if (p.parqFlag) {
    notes.push('你在安全筛查中勾选了需要医生评估的项目（运动时胸痛 / 不明原因晕厥 / 医生曾建议限制运动）。计划已自动降到最低强度，但请先完成医学评估再开始训练 —— 本计划不能替代医疗建议。')
  }

  for (const l of lims) {
    notes.push(`因${LIMITATION_LABEL[l] || l}不适，已排除${EXCLUDE_DESC[l] || '相关动作'}，并优先安排不刺激该部位的低冲击替代动作。训练中若出现疼痛立即停止该动作，不要忍痛完成。`)
  }

  if (bmi >= 28) {
    notes.push(`当前 BMI ${bmi.toFixed(1)}，属于大体重基数。跳跃类动作的落地冲击可达体重的 3–4 倍，已全部排除；有氧优先卧式单车 / 快走 / 椭圆机这类低冲击选项。`)
  } else if (bmi >= 25) {
    notes.push(`当前 BMI ${bmi.toFixed(1)}，已把跳跃类动作排除在有氧选项之外，用坡度走或单车替代，保护膝踝关节。`)
  }

  if (p.age >= 55) {
    notes.push('考虑到年龄，计划增加了关节活动度与平衡类练习，负重动作全部从器械或自重起步，避免一开始就使用自由重量。')
  }

  if (p.trainingLevel === 'k1') {
    notes.push('你目前是 K1（零基础 / 短期使用者）。本计划刻意只安排低冲击、易学的动作 —— K1 阶段最大的收益来自「把动作学会、把频率保住」，而不是练到力竭。')
    notes.push('全身训练的 A / B / C 三天使用相同的基础动作，这是刻意的：初学者的动作模式还没定型，频繁换动作只会延长学习曲线。等升到 K2 后多样性会自动增加。')
  }

  const requested = Math.min(5, Math.max(2, Math.round(p.weeklyDays)))
  if (requested > strengthDays) {
    notes.push(`你希望每周训练 ${requested} 天，但以当前水平每周 ${strengthDays} 次力量训练已足够产生进步。多出来的天数已改为低强度有氧 —— 对新手的恢复能力来说，加量不是优势，掉执行率才是最大的风险。`)
  }

  const missing = CORE_PATTERNS.filter((pat) => !pool.some((e) => e.pattern === pat))
  if (missing.length > 0) {
    notes.push(`受器械或伤病限制，以下动作模式暂时没有可用动作：${missing.map((m) => PATTERN_LABEL[m]).join('、')}。补充器械或解除限制后重新生成计划即可补上。`)
  }

  return notes
}

function buildExcludes(p, cap, bmi) {
  const out = []
  const lims = p.limitations || []
  for (const l of lims) {
    const d = EXCLUDE_DESC[l]
    if (d) out.push(`已排除${d}（${LIMITATION_LABEL[l]}）`)
  }
  if (IMPACT_ORDER[cap] < IMPACT_ORDER.high) {
    const why = p.trainingLevel === 'k1' ? 'K1 阶段一律低冲击' : bmi >= 28 ? '体重基数大' : '安全闸门'
    out.push(`所有高冲击（跳跃 / 冲刺类）动作（${why}）`)
    if (IMPACT_ORDER[cap] <= IMPACT_ORDER.low) {
      out.push('中等冲击的跑跳类有氧（慢跑 / 爬楼 / 划船机 / 单车间歇）')
    }
  }
  return out
}

// ---------------- 主入口 ----------------
// 建档至今经过的周数（用于推进 7 周循环）
// 注意：createdAt 既可能是 'YYYY-MM-DD'，也可能是完整 ISO 时间戳，这里统一只取日期部分。
// 早期版本直接拼接 'T00:00:00'，遇到完整 ISO 会解析失败、永远返回第 1 周，导致周期化形同虚设。
export function weeksSince(dateStr) {
  const day = String(dateStr || '').slice(0, 10)
  const start = new Date(day + 'T00:00:00').getTime()
  if (!Number.isFinite(start)) return 1
  const now = Date.now()
  if (now < start) return 1
  const days = Math.floor((now - start) / 86400000)
  return Math.max(1, Math.floor(days / 7) + 1)
}

function buildProgression(cycleStart, level) {
  const nextLevel = { k1: 'K2', k2: 'K3', k3: 'K4', k4: '保持 K4' }
  return [
    { weeks: `第 ${cycleStart}–${cycleStart + 1} 周`, phase: '适应期', volume: '每个动作 2 组，不追次数', focus: '学会动作轨迹，练完还有余力' },
    { weeks: `第 ${cycleStart + 2}–${cycleStart + 3} 周`, phase: '建立期', volume: '每个动作加到标准组数', focus: '动作质量稳定，节奏统一' },
    { weeks: `第 ${cycleStart + 4}–${cycleStart + 5} 周`, phase: '加强期', volume: '组数不变，次数上限 +2', focus: '本循环强度最高，注意睡眠与恢复' },
    { weeks: `第 ${cycleStart + 6} 周`, phase: '减载周', volume: '组数减 1，强度降到 RPE 5', focus: '主动减量，让恢复追上来' },
    { weeks: `第 ${cycleStart + 7} 周起`, phase: '新循环', volume: '回到适应期，指标重新起算', focus: `评估是否升阶到 ${nextLevel[level]}` },
  ]
}

export function buildTraining(p, bmi) {
  const lims = p.limitations || []
  const norm = { ...p, limitations: lims, weeklyDays: p.weeklyDays || 3, sessionMinutes: p.sessionMinutes || 30 }
  const cap = maxImpact(norm, bmi)
  const pool = buildPool(norm, cap)
  const rx = LEVEL_RX[norm.trainingLevel] || LEVEL_RX.k1

  const weekIndex = weeksSince(norm.createdAt)
  const cycleWeek = ((weekIndex - 1) % 7) + 1
  const phase = phaseForCycleWeek(cycleWeek)
  const cycleStartWeek = weekIndex - (cycleWeek - 1)

  const count = Math.min(EXERCISE_CAP[norm.trainingLevel] || 4, countByMinutes(norm.sessionMinutes))
  const requestedDays = Math.min(5, Math.max(2, Math.round(norm.weeklyDays)))
  const strengthDays = Math.min(STRENGTH_DAYS_CAP[norm.trainingLevel] || 3, requestedDays)

  const split = (() => {
    if (strengthDays <= 3) return Array(strengthDays).fill('full')
    if (strengthDays === 4) return ['upper', 'lower', 'upper', 'lower']
    return ['push', 'pull', 'legs', 'upper', 'lower']
  })()

  const dayIdx = TRAINING_DAY_INDEX[requestedDays] || TRAINING_DAY_INDEX[3]
  const kindByDay = new Map()
  dayIdx.forEach((d, i) => kindByDay.set(d, split[i] || 'cardio'))

  // 非训练日：周日固定完全休息，其余按需分配主动恢复
  const recoveryCount = Math.max(1, Math.min(4, 7 - requestedDays - 2))
  const nonTraining = DAY_NAMES.map((_, i) => i).filter((i) => !kindByDay.has(i))
  const recoverySet = new Set(nonTraining.filter((i) => i !== 6).slice(0, recoveryCount))
  for (const i of nonTraining) {
    kindByDay.set(i, recoverySet.has(i) ? 'recovery' : 'rest')
  }

  let fullVariant = 0
  const days = []
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const dayName = DAY_NAMES[i]
    const kind = kindByDay.get(i) || 'rest'

    if (kind === 'cardio') { days.push(buildCardioDay(dayName, pool, rx, norm)); continue }
    if (kind === 'recovery') { days.push(buildRecoveryDay(dayName, pool)); continue }
    if (kind === 'rest') { days.push(buildRestDay(dayName)); continue }

    let title = SESSION_TITLE[kind]
    let variant = dayIdx.indexOf(i)
    if (kind === 'full') {
      title = `全身训练 ${String.fromCharCode(65 + (fullVariant % 3))}`
      variant = fullVariant
      fullVariant++
    }
    const built = buildStrengthDay(dayName, kind, title, pool, rx, phase, count, variant, norm)
    days.push(built || buildCardioDay(dayName, pool, rx, norm))
  }

  const splitName = split.includes('push') ? '推拉腿分化' : split.includes('upper') ? '上下肢分化' : '全身循环'
  const setsNow = clampSets(rx.setsCompound + phase.setsDelta, rx)
  const cardioNote = `每周安排 ${rx.cardioMin} 分钟左右中等强度有氧，强度判定标准：${rx.cardioRpe}。这个区间能持续消耗热量、且几乎不影响第二天的力量训练；不要一上来就做 HIIT —— 对 K1–K2 水平的用户来说收益不高，却是最容易「练一次就放弃」的原因。`

  return {
    days,
    splitName,
    prescription: {
      setsCompound: setsNow,
      setsIsolation: clampSets(rx.setsIsolation + phase.setsDelta, rx),
      repsCompound: fmtReps(rx.repsCompound, phase.repDelta),
      repsIsolation: fmtReps(rx.repsIsolation, phase.repDelta),
      restCompound: rx.restCompound,
      restIsolation: rx.restIsolation,
      rir: rx.rir,
      rpe: rx.rpe,
      rpeDesc: rx.rpeDesc,
    },
    progression: buildProgression(cycleStartWeek, norm.trainingLevel),
    phase,
    weekIndex,
    cycleWeek,
    cycleStartWeek,
    safetyNotes: buildSafetyNotes(norm, bmi, strengthDays, pool),
    excluded: buildExcludes(norm, cap, bmi),
    cardioNote,
    levelLabel: LEVEL_LABEL[norm.trainingLevel] || LEVEL_LABEL.k1,
    strengthDays,
    requestedDays,
    impactCap: cap,
  }
}

export { LEVEL_RX, STRENGTH_DAYS_CAP, EXERCISE_CAP }
export { LIMITATION_OPTIONS, SESSION_MINUTE_OPTIONS } from './exerciseLibrary.js'
