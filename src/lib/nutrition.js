// ===================== 营养引擎 =====================
// 输入：profile + 当前体重
// 输出：热量目标、三大营养素、纤维、饮水、餐次拆分、一日餐单建议
//
// 采用的公式与依据（仅作为计算依据，不对用户输出文献清单）：
//   BMR         → Mifflin-St Jeor（当前临床与运动营养领域最常用的估算式）
//   TDEE        → BMR × 活动系数
//   能量当量    → 1 kg 脂肪组织 ≈ 7700 kcal
//   安全减重速率→ 每周 0.5%–1.0% 体重（BMI 越高可接近上限），按百分比而非固定公斤
//   蛋白质      → 减脂期 1.7 g/kg 参考体重，受「总热量 40%」与「2.2 g/kg」双上限约束
//   脂肪        → 不低于 0.6 g/kg 体重，且不低于总热量 20%（激素与脂溶性维生素）
//   纤维        → 14 g / 1000 kcal，女性 ≥25 g、男性 ≥30 g，上限 38 g
//   饮水        → 33 ml/kg，训练日额外 +500 ml
//   热效应      → 蛋白质的食物热效应约 20–30%，高蛋白饮食本身即提高消耗
//
// 为什么不能只看「TDEE 减 15%」：固定百分比对不同体重基数的人意味着完全不同的实际风险。
// 同一个 15% 缺口，对 60kg 的人可能是每周 -0.9% 体重，对 100kg 的人只有 -0.5% 体重。
// 因此本引擎以「每周体重百分比」作为主约束，再用 TDEE 百分比作为上限兜底。

export const DIET_LABEL = {
  balanced: '均衡饮食', highprotein: '高蛋白饮食', lowcarb: '低碳饮食',
}

const MACRO_RATIO = {
  balanced: { p: 0.30, c: 0.40, f: 0.30 },
  highprotein: { p: 0.40, c: 0.30, f: 0.30 },
  lowcarb: { p: 0.35, c: 0.25, f: 0.40 },
}

const round = (n) => Math.round(n)
const round1 = (n) => Math.round(n * 10) / 10

export function calcBMI(weight, heightCm) {
  const m = heightCm / 100
  return m > 0 ? weight / (m * m) : 0
}

// Mifflin-St Jeor
export function calcBMR(p, weight) {
  const base = 10 * weight + 6.25 * p.heightCm - 5 * p.age
  return p.gender === 'male' ? base + 5 : base - 161
}

// 安全减重速率上限（每周体重百分比）
// BMI 越高，可承受的相对减重速度越快；正常体重者要更保守以保护瘦体重
function safeRatePct(bmi) {
  if (bmi >= 30) return 0.010
  if (bmi >= 28) return 0.008
  if (bmi >= 25) return 0.007
  return 0.005
}

// 蛋白质的参考体重：肥胖者按目标体重或当前体重的 75% 计算，
// 避免用总体重把蛋白质目标推到不必要的高度
function referenceWeight(p, current, bmi) {
  if (bmi >= 28) return Math.max(p.targetWeight, current * 0.75)
  if (bmi >= 25) return Math.max(p.targetWeight, current * 0.85)
  return current
}

export function computeNutrition(p, current) {
  const notes = []
  const bmrRaw = calcBMR(p, current)
  const bmr = round(bmrRaw)
  const tdee = round(bmr * p.activity)
  const bmi = calcBMI(current, p.heightCm)

  // ---------- 1. 每周减重目标：按体重百分比校正 ----------
  const capPct = safeRatePct(bmi)
  const maxLossKg = round1(capPct * current)
  const requested = p.weeklyTargetKg > 0 ? p.weeklyTargetKg : 0.5
  const weeklyTargetKgActual = round1(Math.max(0.2, Math.min(requested, maxLossKg)))

  if (weeklyTargetKgActual < requested - 0.01) {
    notes.push(
      `你选择的每周 -${requested}kg 相当于每周体重的 ${round1((requested / current) * 100)}%，超过了当前体重下的安全上限。` +
      `已校正为 -${weeklyTargetKgActual}kg（约 ${round1((weeklyTargetKgActual / current) * 100)}% 体重/周）—— ` +
      `更快的速度掉的主要是水分与肌肉，而且会触发代谢适应，这正是体重反弹的起点。`,
    )
  }

  // ---------- 2. 热量缺口与摄入目标 ----------
  let deficit = round((weeklyTargetKgActual * 7700) / 7)
  const deficitCapPct = bmi >= 30 ? 0.30 : 0.25
  const deficitCap = round(tdee * deficitCapPct)
  if (deficit > deficitCap) {
    deficit = deficitCap
    notes.push(`热量缺口已限制在 TDEE 的 ${Math.round(deficitCapPct * 100)}% 以内（${deficitCap} kcal）。缺口服过大会同时掉肌肉、压低静息代谢，并显著提高暴食风险。`)
  }

  // 摄入下限：不低于 1.1 × BMR，同时不低于通用底线（男 1500 / 女 1200）
  const absoluteFloor = p.gender === 'male' ? 1500 : 1200
  const floor = Math.max(absoluteFloor, round(bmrRaw * 1.1))
  let targetCalories = tdee - deficit
  if (targetCalories < floor) {
    targetCalories = floor
    notes.push(`每日摄入已锁定在下限 ${floor} kcal（不低于 1.1 倍基础代谢）。再往下压会牺牲瘦体重、影响月经与免疫，属于得不偿失的做法。`)
  }
  const effectiveDeficit = Math.max(0, tdee - targetCalories)

  // ---------- 3. 三大营养素 ----------
  const refWeight = referenceWeight(p, current, bmi)

  // 蛋白质：减脂期 1.7 g/kg 参考体重，同时受「总热量 40%」与「2.2 g/kg」双上限约束
  const proteinTarget = round(refWeight * 1.7)
  const proteinKcalCap = round((targetCalories * 0.4) / 4)
  const proteinKgCap = round(refWeight * 2.2)
  const proteinG = Math.min(proteinTarget, proteinKcalCap, proteinKgCap)
  if (proteinG < proteinTarget) {
    notes.push(`蛋白质目标受总热量限制，已定在 ${proteinG}g。若想把蛋白质吃足，建议选择「高蛋白饮食」偏好，或适当提高每日摄入总量。`)
  }
  if (proteinG < round(refWeight * 1.6)) {
    notes.push(`当前蛋白质 ${proteinG}g 偏低（低于 1.6 g/kg）。减脂期蛋白质不足会直接造成肌肉流失，而肌肉是维持代谢的核心资产。`)
  }

  // 脂肪：不低于 0.6 g/kg 且不低于总热量 20%
  const fatFloor = Math.max(round(current * 0.6), round((targetCalories * 0.2) / 9))
  const r = MACRO_RATIO[p.diet] || MACRO_RATIO.balanced
  let fatG = Math.max(fatFloor, round((targetCalories * r.f) / 9))

  // 碳水补差，设 80g 下限（保证训练表现与脑供能）
  let carbsG = round((targetCalories - proteinG * 4 - fatG * 9) / 4)
  if (carbsG < 80) {
    carbsG = 80
    fatG = Math.max(fatFloor, round((targetCalories - proteinG * 4 - carbsG * 4) / 9))
    notes.push('碳水已按 80g 保底（大脑与力量训练的主要供能来源）。若目标是极低碳饮食，建议在专业人士指导下进行，而非自行压到极低。')
  }

  const macroKcal = proteinG * 4 + carbsG * 4 + fatG * 9
  if (macroKcal > targetCalories + 60) {
    notes.push(`由于蛋白质与脂肪的下限约束，三大营养素合计约 ${macroKcal} kcal，略高于热量目标。实际执行时优先保证蛋白质达标，碳水按饱腹感灵活增减即可。`)
  }

  // ---------- 4. 纤维与饮水 ----------
  const fiberG = Math.min(38, Math.max(p.gender === 'male' ? 30 : 25, round((targetCalories / 1000) * 14)))
  const waterMl = Math.min(4000, Math.max(1500, Math.round((current * 33) / 50) * 50))

  // ---------- 5. 餐次与蛋白质分配 ----------
  const mealsPerDay = targetCalories >= 1800 ? 4 : 3
  const proteinPerMealG = round(proteinG / mealsPerDay)
  if (proteinPerMealG < 25) {
    notes.push(`当前每餐蛋白质约 ${proteinPerMealG}g，略低于单次最大化肌肉合成所需的 25–40g 区间。可考虑把蛋白质再均匀拆分成 ${mealsPerDay + 1} 餐。`)
  }

  // ---------- 6. 饮食偏好与其它一致性提醒 ----------
  if (p.diet === 'lowcarb') {
    notes.push('低碳饮食初期会因糖原与水一起流失而出现体重快速下降，这属于正常现象而非脂肪减少，不必因此加码缺口。训练强度偏高时，建议把一天中 30–50g 碳水安排在训练前后。')
  }
  if (p.diet === 'highprotein') {
    notes.push('高蛋白饮食请同步把饮水提到目标值以上，并保证纤维摄入，否则容易出现便秘与代谢负担。')
  }
  if (p.activity <= 1.2 && Math.min(5, Math.max(2, Math.round(p.weeklyDays || 3))) >= 4) {
    notes.push('你的日常活动量填的是「久坐」，但训练频率却在每周 4 天以上。建议核对一下活动系数 —— 低估 TDEE 会让摄入目标偏低、训练恢复变差。')
  }

  notes.push(`蛋白质按每餐 ${proteinPerMealG}g 均匀分配（共 ${mealsPerDay} 餐），比集中在晚餐更有利于全天维持肌肉合成；训练后 2 小时内安排一餐高蛋白效果最佳。`)
  notes.push(`饮水目标 ${waterMl} ml，训练日在此基础上再加 500 ml。餐前 300 ml 水可显著降低当餐摄入量。`)
  notes.push(`膳食纤维目标 ${fiberG} g。纤维是减脂期最被低估的变量：它同时提供饱腹感、稳定血糖、改善肠道菌群，且几乎不贡献热量。`)

  return {
    bmi: round1(bmi),
    bmr,
    tdee,
    deficit: effectiveDeficit,
    deficitCapPct,
    dailyCalories: targetCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    waterMl,
    weeklyTargetKgActual,
    refWeight: round1(refWeight),
    mealsPerDay,
    proteinPerMealG,
    meals: buildMeals(p.diet, targetCalories, mealsPerDay),
    notes,
  }
}

// ---------------- 一日餐单 ----------------
function buildMeals(pref, target, mealsPerDay) {
  const table = {
    balanced: {
      b: ['鸡蛋 2 个', '全麦面包 2 片', '无糖豆浆 300ml', '小番茄一把'],
      l: ['糙米饭 1 拳', '鸡胸肉 / 鱼 1 掌', '绿叶蔬菜 2 拳', '少油烹调'],
      d: ['红薯 1 个', '虾仁 / 豆腐 1 掌', '凉拌蔬菜 1 大碗', '味噌汤 1 碗'],
      s: ['无糖希腊酸奶 150g', '蓝莓一小碗'],
    },
    highprotein: {
      b: ['鸡蛋白 3 个 + 全蛋 1 个', '无糖希腊酸奶 200g', '燕麦 40g'],
      l: ['鸡胸肉 / 牛腱 1.5 掌', '杂粮饭半拳', '西兰花 / 菠菜不限量'],
      d: ['清蒸鱼 1.5 掌', '豆腐半块', '菌菇蔬菜汤'],
      s: ['鸡蛋白 2 个 + 无糖豆浆 250ml', '或乳清蛋白 1 份'],
    },
    lowcarb: {
      b: ['牛油果半个', '煎蛋 2 个', '无糖黑咖啡', '坚果一小把'],
      l: ['牛排 / 三文鱼 1.5 掌', '大量绿叶沙拉', '橄榄油 + 柠檬汁'],
      d: ['鸡腿去皮 1.5 掌', '花菜米 1 碗', '炒菌菇'],
      s: ['坚果 15g', '奶酪 1 片'],
    },
  }

  const t = table[pref] || table.balanced
  if (mealsPerDay >= 4) {
    // 四餐：25% / 35% / 15% / 25%
    return [
      { meal: '早餐', items: t.b, kcal: round(target * 0.25) },
      { meal: '午餐', items: t.l, kcal: round(target * 0.35) },
      { meal: '加餐', items: t.s, kcal: round(target * 0.15) },
      { meal: '晚餐', items: t.d, kcal: round(target * 0.25) },
    ]
  }
  // 三餐：30% / 40% / 30%
  return [
    { meal: '早餐', items: t.b, kcal: round(target * 0.3) },
    { meal: '午餐', items: t.l, kcal: round(target * 0.4) },
    { meal: '晚餐', items: t.d, kcal: round(target * 0.3) },
  ]
}
