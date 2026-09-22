// ===================== 计划编排层 =====================
// 职责：把「营养引擎」与「训练引擎」的输出合并成一份完整计划对象。
// 所有计算都在本地完成，零网络传输。
//
// 与旧版的差别（旧版的问题）：
//   旧版 generatePlan(profile) 里 buildWorkout(profile.equipment) 只接收了「器械」这一个参数，
//   档案里根本没有「运动水平」这个字段 —— 结果是久坐零基础的用户和训练一年的用户拿到同一份计划。
//   新版把「水平 / 频率 / 单次时长 / 伤病 / PAR-Q」纳入档案，并由训练引擎做三重闸门过滤。
//
// 兼容性：返回对象保留了旧版的全部字段（dailyCalories / macros / weeklyLoss / estWeeks / note /
//   dietTips / workout.days[].moves），因此仪表盘、打卡页、复盘页等模块无需改动即可继续工作；
//   workout.days[].moves 同时保留「动作名 + 组次」的纯字符串形态，供 exerciseDB.parseMove
//   解析出可点击的动作介绍链接。

import { computeNutrition, calcBMR, DIET_LABEL } from './nutrition.js'
import { buildTraining, LEVEL_LABEL, LEVEL_DESC } from './trainingEngine.js'

export { DIET_LABEL }
export { LEVEL_LABEL, LEVEL_DESC }

const ACTIVITY_LEVELS = [
  { value: 1.2, label: '久坐（几乎不运动）' },
  { value: 1.375, label: '轻度活动（每周 1-3 次）' },
  { value: 1.55, label: '中度活动（每周 3-5 次）' },
  { value: 1.725, label: '高度活动（每周 6-7 次）' },
]

export { ACTIVITY_LEVELS }

// 计划结构版本：用于识别「按旧逻辑生成的计划」并触发重建
export const PLAN_VERSION = 2

export const WEEKLY_LOSS_OPTIONS = [
  { value: 0.25, label: '0.25 kg / 周（最稳，几乎不掉肌肉）' },
  { value: 0.5, label: '0.5 kg / 周（推荐，速度与可持续性平衡）' },
  { value: 0.75, label: '0.75 kg / 周（偏快，需严格执行）' },
  { value: 1.0, label: '1.0 kg / 周（激进，引擎会按体重自动校正）' },
]

// 兼容旧导出名（旧版 plan.js 里就叫 bmr）
export function bmr(profile) {
  return Math.round(calcBMR(profile, profile.startWeight))
}

// 计划是否与当前档案一致：用于「档案补全后自动重建计划」
export function profileSignature(p) {
  if (!p) return ''
  return [
    p.gender, p.age, p.heightCm, p.startWeight, p.targetWeight,
    p.activity, p.equipment, p.diet,
    p.trainingLevel, p.weeklyDays, p.sessionMinutes,
    (p.limitations || []).join('+'), p.parqFlag ? 1 : 0, p.weeklyTargetKg,
  ].join('|')
}

// 生成完整计划
export function generatePlan(profile, currentWeight) {
  const current = currentWeight && currentWeight > 0 ? currentWeight : profile.startWeight

  const n = computeNutrition(profile, current)
  const t = buildTraining(profile, n.bmi)

  // 目标缺口对应的理论周期（kcal → 脂肪当量 7700 kcal/kg）
  const kgToLose = Math.max(0, current - profile.targetWeight)
  const weeklyLoss = n.weeklyTargetKgActual
  const estWeeks = weeklyLoss > 0 ? Math.ceil(kgToLose / weeklyLoss) : 0

  const days = t.days.map((d) => {
    const isStrength = (d.exercises || []).some((e) => e.kind === 'strength')
    return {
      day: d.day,
      title: d.title || d.day,
      focus: d.focus,
      isStrength,
      // 兼容字段：供 exerciseDB.parseMove / LinkedMove 解析出动作介绍链接
      moves: d.exercises.map((e) => `${e.label} ${e.sets}`.trim()),
      exercises: d.exercises,
      warmup: d.warmup || [],
      cooldown: d.cooldown || [],
      durationMin: d.durationMin,
      isRest: !!d.isRest,
      note: d.note,
    }
  })

  const totalMinutes = days.reduce((sum, d) => sum + (d.durationMin || 0), 0)

  return {
    version: PLAN_VERSION,
    builtFrom: profileSignature(profile),
    generatedAt: new Date().toISOString(),

    // ---- 身体数据 ----
    bmi: n.bmi,

    // ---- 热量与宏量（兼容旧字段名） ----
    bmr: n.bmr,
    tdee: n.tdee,
    deficit: n.deficit,
    deficitCapPct: n.deficitCapPct,
    dailyCalories: n.dailyCalories,
    macros: { protein: n.proteinG, carbs: n.carbsG, fat: n.fatG },
    fiberG: n.fiberG,
    waterMl: n.waterMl,
    refWeight: n.refWeight,
    mealsPerDay: n.mealsPerDay,
    proteinPerMealG: n.proteinPerMealG,
    meals: n.meals,

    // ---- 周期预测 ----
    weeklyLoss,
    estWeeks,

    // ---- 训练 ----
    workout: {
      title: `${t.levelLabel} · ${t.splitName}（每周 ${t.strengthDays} 练力量）`,
      splitName: t.splitName,
      levelLabel: t.levelLabel,
      days,
      totalMinutes,
      strengthDays: t.strengthDays,
      requestedDays: t.requestedDays,
      impactCap: t.impactCap,
      prescription: t.prescription,
      progression: t.progression,
      phase: t.phase,
      weekIndex: t.weekIndex,
      cycleWeek: t.cycleWeek,
      cycleStartWeek: t.cycleStartWeek,
      safetyNotes: t.safetyNotes,
      excluded: t.excluded,
      cardioNote: t.cardioNote,
    },

    // ---- 顶层便捷字段 ----
    levelLabel: t.levelLabel,
    phaseName: t.phase.name,
    phaseDesc: t.phase.desc,

    dietTips: buildDietTips(profile.diet, n, t),
    note: `热量缺口 ${n.deficit} kcal（TDEE 的 ${Math.round((n.deficit / n.tdee) * 100)}%，上限 ${Math.round(n.deficitCapPct * 100)}%），对应每周约 -${weeklyLoss} kg（约 ${Math.round((weeklyLoss / current) * 1000) / 10}% 体重）。` +
      `这个速度属于可持续区间：掉的主要是脂肪、能保住肌肉，也不会因为压得太狠而触发代谢适应与反弹。`,
  }
}

// ---------------- 饮食执行要点 ----------------
function buildDietTips(diet, n, t) {
  const common = [
    `每餐先吃蛋白质和蔬菜，最后吃主食，自然降低总摄入；蛋白质按每餐约 ${n.proteinPerMealG}g 分配（共 ${n.mealsPerDay} 餐）`,
    '烹饪以蒸、煮、烤为主，每日烹调油控制在 25g 以内（约 2 瓷勺）',
    '含糖饮料全部替换为水 / 无糖茶；酒精每周不超过 1 次 —— 酒精会抑制脂肪氧化并放大食欲',
    `饮水 ${n.waterMl} ml / 天（训练日 +500 ml），餐前 300 ml 水能显著降低当餐摄入`,
    `膳食纤维目标 ${n.fiberG} g：蔬菜 500g + 低糖水果 200g + 全谷杂豆，是饱腹感的主要来源`,
    '睡眠 7 小时以上：睡眠不足会让饥饿素上升约 15%、瘦素下降，第二天很难控制食欲',
  ]

  const byDiet = {
    lowcarb: [
      '主食集中在早餐与训练前后，晚餐以蛋白 + 蔬菜为主',
      '选择低 GI 碳水：燕麦、糙米、红薯替代精米白面',
      '低碳初期体重下降较快是糖原与水分流失，不是脂肪减少，不要因此加码缺口',
    ],
    highprotein: [
      `蛋白质定在 ${n.proteinG}g（约 1.7 g/kg 参考体重）：鸡胸、鱼虾、蛋清、低脂奶、豆制品轮换`,
      '蛋白质分 4 餐摄入，每餐 25–40g 利用率最高；训练后 2 小时内安排一餐高蛋白',
      '高蛋白饮食务必同步把饮水提到目标值以上，并保证纤维摄入',
    ],
    balanced: [
      '三餐热量按 3:4:3 分配，避免晚餐过量',
      '蛋白质来源多样化：肉、蛋、奶、豆制品各占约 1/4',
      '每天保证 1 拳主食 + 1 掌蛋白 + 2 拳蔬菜的三餐结构',
    ],
  }

  const tips = [...(byDiet[diet] || byDiet.balanced), ...common]

  // 训练相关的饮食提醒，按用户真实水平与所处阶段给，而不是泛泛而谈
  if (t.phase && t.phase.deload) {
    tips.push('本周是减载周：训练量下降，饮食不必刻意再加量，按目标热量执行即可')
  } else if (t.phase && t.phase.name === '加强期') {
    tips.push('本周是加强期：强度最高的一段，请优先保证蛋白质达标与睡眠充足')
  }
  if (t.requestedDays > t.strengthDays) {
    tips.push('有氧日的额外消耗不建议用「加餐」补回来 —— 那正是很多人练了却瘦不下来的原因')
  }

  return tips
}
