// 计划生成引擎回归校验：对生成计划做硬断言，覆盖四条不变量 + 时长预算 + 营养地板 + 动作链接集成。
// 用法：npm run verify:plan
import { generatePlan } from '../src/lib/plan.js'
import { EXERCISES, LEVEL_ORDER, IMPACT_ORDER, canUseEquipment, isBlocked } from '../src/lib/exerciseLibrary.js'
import { maxImpact } from '../src/lib/trainingEngine.js'
import { normalizeProfile } from '../src/lib/storage.js'

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))
const STRENGTH_PREFIX = ['全身训练', '上肢训练', '下肢训练', '推类训练', '拉类训练', '腿部训练']
const isStrengthDay = (d) => STRENGTH_PREFIX.some((t) => String(d.title || '').startsWith(t))

let fail = 0
const err = (m) => { console.log('  ✗ ' + m); fail++ }

function check(name, profile, expect) {
  const p = normalizeProfile(profile)
  const plan = generatePlan(p, p.startWeight)
  const cap = maxImpact(p, plan.bmi)
  const capMax = IMPACT_ORDER[cap]
  const lvl = LEVEL_ORDER[p.trainingLevel]

  console.log(`\n=== ${name} | ${plan.levelLabel} | BMI ${plan.bmi} | 冲击上限 ${cap} | 缺口 ${plan.deficit}/${plan.tdee} | 周降 ${plan.weeklyLoss}kg`)

  let moveCount = 0
  let strengthDays = 0
  const seen = new Set()

  for (const d of plan.workout.days) {
    // 兼容字段 moves 与 exercises 必须一一对应
    if (d.moves.length !== d.exercises.length) err(`${d.day} moves/exercises 长度不一致 (${d.moves.length} vs ${d.exercises.length})`)

    if (!isStrengthDay(d)) continue
    strengthDays++

    // 时长预算：允许 5 分钟弹性 + 2 分钟舍入
    if (d.durationMin > p.sessionMinutes + 7) err(`${d.day} 估算 ${d.durationMin} 分钟，超出声明 ${p.sessionMinutes} 分钟`)

    for (const e of d.exercises) {
      moveCount++
      seen.add(e.id)
      const ex = BY_ID.get(e.id)
      if (!ex) { err(`${d.day} 动作 id 不在动作库中：${e.id}（${e.name}）`); continue }
      if (LEVEL_ORDER[ex.minLevel] > lvl) err(`${d.day} 水平越级：${ex.name} 需 ${ex.minLevel}，用户 ${p.trainingLevel}`)
      if (!canUseEquipment(ex, p.equipment)) err(`${d.day} 器械越权：${ex.name} 需 ${ex.equip.join('/')}，用户 ${p.equipment}`)
      if (isBlocked(ex, p.limitations)) err(`${d.day} 禁忌冲突：${ex.name} 命中 ${p.limitations}`)
      if (ex.pattern !== 'mobility' && IMPACT_ORDER[ex.impact] > capMax) err(`${d.day} 冲击超限：${ex.name} ${ex.impact} > ${cap}`)
      if (p.trainingLevel === 'k1' && ex.pattern !== 'mobility' && ex.impact !== 'low') err(`K1 出现非低冲击：${ex.name} ${ex.impact}`)
    }
  }

  // 营养地板
  const floor = Math.max(p.gender === 'male' ? 1500 : 1200, Math.round(plan.bmr * 1.1))
  if (plan.dailyCalories < floor - 1) err(`热量低于下限 ${floor}：实际 ${plan.dailyCalories}`)
  if (plan.deficit > Math.round(plan.tdee * plan.deficitCapPct) + 1) err(`缺口超过上限：${plan.deficit} > TDEE×${plan.deficitCapPct}`)
  if (plan.macros.fat < Math.round(p.startWeight * 0.6) - 1) err(`脂肪低于 0.6g/kg 地板：${plan.macros.fat}`)
  if (plan.macros.carbs < 80) err(`碳水低于 80g 保底：${plan.macros.carbs}`)

  console.log(`  力量日 ${strengthDays} 天 · 动作槽位 ${moveCount} 个 · 单日时长 ${plan.workout.days.filter(isStrengthDay).map((d) => d.durationMin).join('/')}`)
  console.log(`  阶段 ${plan.workout.phase.name}（第 ${plan.workout.cycleWeek} 周 / 总第 ${plan.workout.weekIndex} 周）· 处方 ${plan.workout.prescription.setsCompound}×${plan.workout.prescription.repsCompound} · RPE ${plan.workout.prescription.rpe}`)
  console.log(`  宏量 P${plan.macros.protein} C${plan.macros.carbs} F${plan.macros.fat} · 纤维 ${plan.fiberG}g · 水 ${plan.waterMl}ml`)
  console.log(`  安全说明 ${plan.workout.safetyNotes.length} 条 · 排除项 ${plan.workout.excluded.join('；') || '无'}`)

  if (expect) {
    for (const [k, v] of Object.entries(expect)) {
      if (k === 'hasK1Only' && v) {
        const bad = [...seen].map((id) => BY_ID.get(id)).filter((e) => e && e.pattern !== 'mobility' && e.impact !== 'low')
        if (bad.length) err(`K1 含非低冲击动作：${bad.map((e) => e.name).join('、')}`)
      }
      if (k === 'maxStrengthDays' && strengthDays > v) err(`力量日 ${strengthDays} 超过上限 ${v}`)
      if (k === 'forbidIds' && v.length) {
        const hit = v.filter((id) => seen.has(id))
        if (hit.length) err(`使用了应被排除的动作：${hit.join('、')}`)
        else console.log(`  ✓ 已正确排除：${v.join('、')}`)
      }
      if (k === 'wantIds' && v.length) {
        const missing = v.filter((id) => !seen.has(id))
        if (missing.length) err(`未编排到期望动作：${missing.join('、')}`)
        else console.log(`  ✓ 已包含期望动作：${v.join('、')}`)
      }
    }
  }
  return plan
}

const base = {
  name: 't', gender: 'male', age: 32, heightCm: 175, startWeight: 90, targetWeight: 75,
  activity: 1.375, equipment: 'none', diet: 'balanced',
  trainingLevel: 'k1', weeklyDays: 3, sessionMinutes: 30, limitations: [], parqFlag: false,
  weeklyTargetKg: 0.5, createdAt: '2026-09-01T00:00:00.000Z',
}

// 1. K1 徒手（核心场景：旧版给了一堆 4×力竭 / 波比跳）
check('K1 徒手 3 天 30 分钟', { ...base }, {
  hasK1Only: true, maxStrengthDays: 3,
  forbidIds: ['burpee', 'jump_squat', 'jumping_jack', 'pushup', 'bw_squat', 'bulgarian_split_squat', 'russian_twist', 'mountain_climber', 'lunge'],
})

// 2. K1 哑铃
check('K1 哑铃 3 天 30 分钟', { ...base, equipment: 'dumbbell' }, { hasK1Only: true, maxStrengthDays: 3 })

// 3. K1 健身房，但用户要 5 天 × 20 分钟
check('K1 健身房 5 天 20 分钟', { ...base, equipment: 'gym', weeklyDays: 5, sessionMinutes: 20 }, { hasK1Only: true, maxStrengthDays: 3 })

// 4. K1 膝伤 + 手腕伤
check('K1 徒手 膝+腕受限', { ...base, limitations: ['knee', 'wrist'] }, { hasK1Only: true })

// 5. K1 大体重（BMI 33）
check('K1 徒手 BMI 33', { ...base, startWeight: 110, targetWeight: 85, gender: 'female', heightCm: 160, age: 41 }, { hasK1Only: true })

// 6. K1 PAR-Q 阳性
check('K1 PAR-Q 阳性', { ...base, parqFlag: true, age: 58 }, { hasK1Only: true })

// 7. K1 第 5 周（加强期），验证次数上限 +2 且时长预算仍守住
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()
check('K1 第 5 周（加强期）', { ...base, createdAt: daysAgo(30) }, { hasK1Only: true })
// 7b. K1 第 7 周（减载周）
check('K1 第 7 周（减载周）', { ...base, createdAt: daysAgo(44) }, { hasK1Only: true })

// 8. K2 哑铃
check('K2 哑铃 4 天 45 分钟', { ...base, trainingLevel: 'k2', equipment: 'dumbbell', weeklyDays: 4, sessionMinutes: 45 }, { wantIds: ['db_rdl'] })

// 9. K3
check('K3 徒手 4 天 45 分钟', { ...base, trainingLevel: 'k3', weeklyDays: 4, sessionMinutes: 45 })

// 10. K4 健身房（正常 BMI → 冲击上限放开，必须拿到杠铃主项）
check('K4 健身房 5 天 60 分钟', { ...base, trainingLevel: 'k4', equipment: 'gym', weeklyDays: 5, sessionMinutes: 60, startWeight: 80, heightCm: 180, age: 30, targetWeight: 72 }, {
  wantIds: ['barbell_squat', 'barbell_deadlift'],
})

// 11. K4 但 BMI 29 → 只排除跳跃/冲刺，杠铃主项必须保留（脊柱负荷 ≠ 落地冲击）
check('K4 健身房 BMI 29.4（保留自由重量）', { ...base, trainingLevel: 'k4', equipment: 'gym', weeklyDays: 5, sessionMinutes: 60 }, {
  wantIds: ['barbell_squat', 'barbell_deadlift'],
  forbidIds: ['burpee', 'treadmill_intervals', 'jump_squat', 'jumping_jack', 'jump_rope'],
})

// 12. K2 但 BMI 29 → 未达系统训练基础，mid 级复合动作仍应排除
check('K2 健身房 BMI 29.4（mid 一并排除）', { ...base, trainingLevel: 'k2', equipment: 'gym', weeklyDays: 4, sessionMinutes: 45 }, {
  forbidIds: ['barbell_squat', 'barbell_deadlift', 'burpee'],
})

// 13. 旧版 v1 档案（无水平字段）→ 必须回落 K1
const legacy = normalizeProfile({ name: 'old', gender: 'male', age: 40, heightCm: 172, startWeight: 88, targetWeight: 76, activity: 1.375, equipment: 'none', diet: 'balanced' })
console.log(`\n=== v1 旧档案迁移 ===\n  补齐结果：level=${legacy.trainingLevel} days=${legacy.weeklyDays} min=${legacy.sessionMinutes} limits=[${legacy.limitations}] createdAt=${legacy.createdAt ? 'ok' : 'MISSING'}`)
if (legacy.trainingLevel !== 'k1' || legacy.weeklyDays !== 3 || legacy.sessionMinutes !== 30) err('v1 旧档案未按最保守口径补齐')

// ===================== LinkedMove / parseMove 集成校验 =====================
// 计划页与打卡页会把 plan.workout.days[].moves 的字符串交给 exerciseDB.parseMove
// 解析成可点击的动作介绍链接。新引擎改了动作命名，必须验证这条契约没被破坏。
{
  const { parseMove } = await import('../src/lib/exerciseDB.js')
  const hasLink = (text) => parseMove(text).some((s) => s.url)

  console.log('\n=== LinkedMove 集成 ===')

  const plan = generatePlan(normalizeProfile({ ...base }), base.startWeight)
  let checked = 0
  let linked = 0

  for (const d of plan.workout.days) {
    for (let i = 0; i < d.moves.length; i++) {
      const m = d.moves[i]
      const e = d.exercises[i]
      if (!e || typeof e.label !== 'string' || !e.label) err(`${d.day} 动作缺少 label，LinkedMove 会拿到 undefined`)
      const segs = parseMove(m)
      // 解析必须无损：片段拼接后与原串完全一致，否则界面上会少字
      const round = segs.map((s) => s.text).join('')
      if (round !== m) err(`parseMove 丢字：'${m}' -> '${round}'`)
      checked++
      if (segs.some((s) => s.url)) linked++
    }
  }

  // 反向断言：K1 的核心动作必须都能点开看介绍
  const MUST_LINK = [
    '椅子深蹲（坐到起立）', '靠墙静蹲', '墙面俯卧撑', '上斜俯卧撑（撑桌/台阶）',
    '臀桥', '鸟狗式', '死虫式', '快走', '原地踏步（提膝）', '蚌式开合',
    '站姿提踵', '跪姿平板支撑', '俯卧 Y 字抬举',
  ]
  const bad = MUST_LINK.filter((l) => !hasLink(l))
  if (bad.length) err(`K1 关键动作缺少介绍链接：${bad.join('、')}`)

  // 最长词优先必须仍然生效：'杠铃深蹲' 不能被短词 '深蹲' 抢先匹配
  const seg = parseMove('杠铃深蹲 4×6').find((s) => s.url)
  if (!seg || seg.text !== '杠铃深蹲') err(`最长词优先失效：'杠铃深蹲' 被解析为 '${seg && seg.text}'`)
  if (!hasLink('保加利亚分腿蹲 3×10/侧')) err('原有直达链接丢失：保加利亚分腿蹲')

  console.log(`  解析 ${checked} 条 moves，其中 ${linked} 条可点击（${Math.round((linked / checked) * 100)}%）`)
  console.log(`  K1 关键动作链接检查：${MUST_LINK.length - bad.length}/${MUST_LINK.length} 通过`)
}

console.log(`\n${fail === 0 ? '✓ 全部校验通过：无水平越级 / 无器械越权 / 无禁忌冲突 / K1 全低冲击 / 时长与营养地板守住 / LinkedMove 集成完好' : `✗ 共 ${fail} 项失败`}`)
process.exit(fail === 0 ? 0 : 1)