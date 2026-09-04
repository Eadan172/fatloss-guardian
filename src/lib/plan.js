// 个性化计划生成引擎
// 热量：Mifflin-St Jeor 公式 → TDEE → 温和缺口（15%，钳制在 300~550 kcal）
// 宏量营养素：蛋白质按体重克数，脂肪按 0.8 g/kg，碳水补足剩余热量

const ACTIVITY_LEVELS = [
  { value: 1.2, label: '久坐（几乎不运动）' },
  { value: 1.375, label: '轻度活动（每周 1-3 次）' },
  { value: 1.55, label: '中度活动（每周 3-5 次）' },
  { value: 1.725, label: '高度活动（每周 6-7 次）' },
]

export { ACTIVITY_LEVELS }

export function bmr({ gender, age, heightCm, startWeight }) {
  const base = 10 * startWeight + 6.25 * heightCm - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

export function generatePlan(profile) {
  const b = bmr(profile)
  const tdee = Math.round(b * profile.activity)
  let deficit = Math.round(tdee * 0.15)
  deficit = Math.max(300, Math.min(550, deficit))
  const dailyCalories = tdee - deficit

  // 蛋白质：按饮食偏好微调 g/kg
  const proteinPerKg = profile.diet === 'highprotein' ? 2.0 : profile.diet === 'lowcarb' ? 1.8 : 1.6
  const protein = Math.round(proteinPerKg * profile.targetWeight)
  const fat = Math.round(0.8 * profile.targetWeight)
  const carbs = Math.max(50, Math.round((dailyCalories - protein * 4 - fat * 9) / 4))

  // 预计周期：7700 kcal ≈ 1 kg 脂肪
  const kgToLose = Math.max(0, profile.startWeight - profile.targetWeight)
  const weeklyLoss = (deficit * 7) / 7700
  const estWeeks = weeklyLoss > 0 ? Math.ceil(kgToLose / weeklyLoss) : 0

  return {
    generatedAt: new Date().toISOString(),
    bmr: b,
    tdee,
    deficit,
    dailyCalories,
    macros: { protein, carbs, fat },
    weeklyLoss: Math.round(weeklyLoss * 100) / 100,
    estWeeks,
    workout: buildWorkout(profile.equipment),
    dietTips: buildDietTips(profile.diet),
    note: '热量缺口设定为 TDEE 的 15%（300–550 kcal 区间），属于温和可持续的减脂速度，约每周 0.3–0.5 kg，可最大限度保留肌肉、降低代谢适应与反弹风险。',
  }
}

function buildWorkout(equipment) {
  if (equipment === 'gym') {
    return {
      title: '固定器械 / 健身房方案（每周 4 练 + 2 次有氧）',
      days: [
        { day: '周一', focus: '上肢推', moves: ['器械卧推 4×10', '坐姿推肩 3×12', '绳索下压 3×12', '器械夹胸 3×12'] },
        { day: '周二', focus: '下肢', moves: ['腿举 4×12', '坐姿腿弯举 3×12', '髋外展 3×15', '提踵 3×15'] },
        { day: '周三', focus: '有氧', moves: ['椭圆机或快走 40 分钟（心率 120-135）'] },
        { day: '周四', focus: '上肢拉', moves: ['高位下拉 4×10', '坐姿划船 3×12', '面拉 3×15', '哑铃弯举 3×12'] },
        { day: '周五', focus: '核心 + 有氧', moves: ['平板支撑 3×45s', '死虫式 3×12', '爬坡走 30 分钟'] },
        { day: '周六', focus: '低强度恢复', moves: ['散步 8,000 步以上', '全身拉伸 15 分钟'] },
        { day: '周日', focus: '休息', moves: ['完全休息，注意补水与睡眠'] },
      ],
    }
  }
  if (equipment === 'dumbbell') {
    return {
      title: '哑铃家庭方案（每周 4 练 + 日常步行）',
      days: [
        { day: '周一', focus: '全身 A', moves: ['哑铃深蹲 4×12', '哑铃地板卧推 4×12', '单臂划船 3×12/侧', '平板支撑 3×40s'] },
        { day: '周二', focus: '有氧', moves: ['快走或跳绳 30-40 分钟'] },
        { day: '周三', focus: '全身 B', moves: ['罗马尼亚硬拉 4×12', '哑铃推举 3×12', '反向弓步 3×10/侧', '侧桥 3×30s/侧'] },
        { day: '周四', focus: '休息', moves: ['散步 8,000 步', '拉伸 10 分钟'] },
        { day: '周五', focus: '全身 C', moves: ['高脚杯深蹲 4×12', '俯身飞鸟 3×15', '哑铃臀桥 4×15', '登山跑 3×30s'] },
        { day: '周六', focus: '有氧', moves: ['中低强度有氧 40 分钟（骑车/快走）'] },
        { day: '周日', focus: '休息', moves: ['完全休息'] },
      ],
    }
  }
  return {
    title: '无器械居家方案（每周 5 练，循环递进）',
    days: [
      { day: '周一', focus: '下肢 + 核心', moves: ['徒手深蹲 4×15', '保加利亚分腿蹲 3×10/侧', '臀桥 4×15', '平板支撑 3×40s'] },
      { day: '周二', focus: '上肢 + 心肺', moves: ['俯卧撑（可跪姿）4×力竭', '超人式 3×15', '开合跳 4×30s', '登山跑 3×30s'] },
      { day: '周三', focus: '有氧', moves: ['快走/原地踏步 40 分钟'] },
      { day: '周四', focus: '下肢 + 心肺', moves: ['箭步蹲 4×12/侧', '靠墙静蹲 3×45s', '波比跳（简化）3×10', '侧桥 3×30s/侧'] },
      { day: '周五', focus: '上肢 + 核心', moves: ['俯卧撑 4×力竭', '凳上臂屈伸 3×12', '死虫式 3×12', '俄罗斯转体 3×20'] },
      { day: '周六', focus: '有氧', moves: ['中低强度有氧 40-50 分钟'] },
      { day: '周日', focus: '休息', moves: ['完全休息，全身拉伸 15 分钟'] },
    ],
  }
}

function buildDietTips(diet) {
  const common = [
    '每餐先吃蛋白质和蔬菜，最后吃主食，自然降低总摄入',
    '烹饪以蒸、煮、烤为主，每日烹调油控制在 25g 以内',
    '含糖饮料全部替换为水/无糖茶，酒精每周不超过 1 次',
    '睡前 3 小时不进食，降低夜间加餐概率',
  ]
  if (diet === 'lowcarb') {
    return [
      '主食集中在早餐与训练前后，晚餐以蛋白+蔬菜为主',
      '选择低 GI 碳水：燕麦、糙米、红薯替代精米白面',
      ...common,
    ]
  }
  if (diet === 'highprotein') {
    return [
      '每公斤目标体重 2g 蛋白质：鸡胸、鱼虾、蛋清、低脂奶轮换',
      '蛋白质分 4 餐摄入，每餐 25-40g 利用率最高',
      '训练后 30 分钟内补充 20-30g 蛋白质',
      ...common,
    ]
  }
  return [
    '三餐热量按 3:4:3 分配，避免晚餐过量',
    '每天 500g 蔬菜 + 200g 低糖水果，膳食纤维 ≥25g',
    '蛋白质来源多样化：肉、蛋、奶、豆制品各占 1/4',
    ...common,
  ]
}
