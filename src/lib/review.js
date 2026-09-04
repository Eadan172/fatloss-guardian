// 周期复盘引擎：按周 / 月汇总打卡数据，产出评分与分级建议
// 输出结构：{ period, score, stats, items: [{ tone: 'good'|'warn'|'bad', title, text }] }
import { lastNDays } from './date'

function collect(checkins, days) {
  const rows = []
  for (const d of days) {
    const c = checkins[d]
    if (c) rows.push({ date: d, ...c })
  }
  return rows
}

function avg(rows, key) {
  const vals = rows.map((r) => Number(r[key])).filter((v) => !Number.isNaN(v) && v > 0)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function weightDelta(rows) {
  const ws = rows.map((r) => Number(r.weight)).filter((v) => !Number.isNaN(v) && v > 0)
  if (ws.length < 2) return null
  return Math.round((ws[ws.length - 1] - ws[0]) * 100) / 100
}

function buildReview({ periodLabel, rows, totalDays, plan, settings }) {
  const items = []
  let score = 100

  const checkinRate = rows.length / totalDays
  const avgCal = avg(rows, 'calories')
  const avgProtein = avg(rows, 'protein')
  const avgWater = avg(rows, 'water')
  const avgSleep = avg(rows, 'sleepHours')
  const avgStress = avg(rows, 'stress')
  const workoutDays = rows.filter((r) => r.workoutDone).length
  const delta = weightDelta(rows)

  // 1. 打卡率
  if (checkinRate >= 0.85) items.push({ tone: 'good', title: '打卡率优秀', text: `本${periodLabel}打卡 ${rows.length}/${totalDays} 天（${Math.round(checkinRate * 100)}%）。记录本身就是最强的减重行为干预，继续保持。` })
  else if (checkinRate >= 0.6) { score -= 10; items.push({ tone: 'warn', title: '打卡率中等', text: `打卡 ${rows.length}/${totalDays} 天。漏记的日子往往是失控的日子——建议设定固定打卡时间（如晚餐后），把记录变成自动化习惯。` }) }
  else { score -= 20; items.push({ tone: 'bad', title: '打卡率过低', text: `仅打卡 ${rows.length}/${totalDays} 天。先不追求完美饮食，把「每天睡前 2 分钟记录」作为本${periodLabel}唯一硬性目标。` }) }

  // 2. 体重变化与反弹
  if (delta !== null) {
    if (delta <= -0.2 && delta >= -1.2) items.push({ tone: 'good', title: '减重节奏健康', text: `本${periodLabel}体重变化 ${delta} kg，处于每周 0.2-1.2 kg 的安全区间。过快减重会加速肌肉流失与代谢下降。` })
    else if (delta < -1.2) { score -= 10; items.push({ tone: 'warn', title: '减重速度偏快', text: `变化 ${delta} kg，速度偏快。建议把热量缺口缩小 100-200 kcal 或增加蛋白质，优先保住肌肉——肌肉量决定你未来会不会反弹。` }) }
    else if (delta > 0.5) { score -= 15; items.push({ tone: 'bad', title: '体重回升警报', text: `本${periodLabel}上涨 ${delta} kg。先排查：是否连续多日热量超标、睡眠恶化或压力性进食？对照下方建议逐项修复，不要等到越过反弹线才行动。` }) }
    else items.push({ tone: 'warn', title: '体重平台期', text: `变化 ${delta} kg，基本持平。平台期是身体适应的正常信号：先确认打卡数据真实完整，再考虑将每日热量微调 -100 kcal 或每周增加 1 次有氧。` })
  }

  // 3. 热量执行
  if (plan && avgCal !== null) {
    const target = plan.dailyCalories
    const overDays = rows.filter((r) => Number(r.calories) > target * 1.15).length
    if (avgCal <= target * 1.05) items.push({ tone: 'good', title: '热量控制达标', text: `日均摄入 ${Math.round(avgCal)} kcal，目标 ${target} kcal，执行良好。` })
    else if (overDays >= Math.ceil(totalDays / 3)) { score -= 15; items.push({ tone: 'bad', title: '防暴食干预', text: `日均 ${Math.round(avgCal)} kcal，且 ${overDays} 天明显超标（>${Math.round(target * 1.15)} kcal）。策略：① 每餐先吃 200g 蔬菜+蛋白质再吃主食；② 每周安排 1 顿「计划内放纵餐」降低剥夺感；③ 高风险场景（聚餐/加班）前预先吃一份蛋白质；④ 把零食从视线内移除，环境改造比意志力可靠。` }) }
    else { score -= 8; items.push({ tone: 'warn', title: '热量略超目标', text: `日均 ${Math.round(avgCal)} kcal，超出目标约 ${Math.round(avgCal - target)} kcal。优先检查液体热量（奶茶/果汁/酒）与食用油，这两类最容易被低估。` }) }
  }

  // 4. 蛋白质
  if (plan && avgProtein !== null) {
    if (avgProtein >= plan.macros.protein * 0.9) items.push({ tone: 'good', title: '蛋白质充足', text: `日均 ${Math.round(avgProtein)}g，达到目标 ${plan.macros.protein}g。充足蛋白质是减脂期保肌肉、强饱腹、防反弹的关键。` })
    else { score -= 8; items.push({ tone: 'warn', title: '蛋白质不足', text: `日均 ${Math.round(avgProtein)}g，低于目标 ${plan.macros.protein}g。每餐保证一掌心优质蛋白；必要时用蛋白粉/无糖酸奶补足缺口。` }) }
  }

  // 5. 睡眠修复
  if (avgSleep !== null) {
    if (avgSleep >= settings.sleepGoal) items.push({ tone: 'good', title: '睡眠达标', text: `日均 ${avgSleep.toFixed(1)} 小时。充足睡眠维持瘦素/饥饿素平衡，是食欲稳定的地基。` })
    else { score -= 10; items.push({ tone: 'bad', title: '睡眠修复优先', text: `日均 ${avgSleep.toFixed(1)} 小时，低于目标 ${settings.sleepGoal} 小时。睡眠不足会让饥饿素上升、第二天平均多摄入约 300 kcal。修复清单：① 固定起床时间（含周末）；② 睡前 1 小时屏幕调暗；③ 下午 2 点后不摄入咖啡因；④ 卧室温度 18-22℃。` }) }
  }

  // 6. 压力管理
  if (avgStress !== null && avgStress >= 3.5) {
    score -= 8
    items.push({ tone: 'warn', title: '压力管理', text: `平均压力自评 ${avgStress.toFixed(1)}/5，偏高。高压会推高皮质醇，直接诱发情绪性进食与腹部脂肪堆积。建议：每天 10 分钟盒式呼吸（4-4-4-4），压力大时用「10 分钟快走」替代零食，把进食冲动延迟 15 分钟再决定。` })
  }

  // 7. 运动
  const workoutTarget = periodLabel === '周' ? 4 : 16
  if (workoutDays >= workoutTarget) items.push({ tone: 'good', title: '运动完成度好', text: `完成 ${workoutDays} 次训练。保持当前计划即可，不必再堆量——恢复同样重要。` })
  else { score -= 6; items.push({ tone: 'warn', title: '运动完成度不足', text: `完成 ${workoutDays} 次，目标 ${workoutTarget} 次。把训练约进日历并准备备用方案：没条件完成正式训练时，至少做 10 分钟徒手循环，保住「不中断」的链条。` }) }

  // 8. 饮水
  if (avgWater !== null && avgWater < settings.waterGoal * 0.75) {
    score -= 4
    items.push({ tone: 'warn', title: '饮水不足', text: `日均 ${avgWater.toFixed(1)} 杯，目标 ${settings.waterGoal} 杯。口渴常被大脑误判为饥饿——每餐前先喝一杯水，是自然减量的零成本手段。` })
  }

  score = Math.max(0, Math.min(100, score))
  return {
    score,
    stats: {
      checkinDays: rows.length,
      totalDays,
      checkinRate: Math.round(checkinRate * 100),
      avgCalories: avgCal === null ? null : Math.round(avgCal),
      avgProtein: avgProtein === null ? null : Math.round(avgProtein),
      avgWater: avgWater === null ? null : Math.round(avgWater * 10) / 10,
      avgSleep: avgSleep === null ? null : Math.round(avgSleep * 10) / 10,
      avgStress: avgStress === null ? null : Math.round(avgStress * 10) / 10,
      workoutDays,
      weightDelta: delta,
    },
    items,
  }
}

export function weeklyReview(checkins, plan, settings, endDate) {
  const days = lastNDays(7, endDate)
  return buildReview({ periodLabel: '周', rows: collect(checkins, days), totalDays: 7, plan, settings })
}

export function monthlyReview(checkins, plan, settings, endDate) {
  const days = lastNDays(30, endDate)
  return buildReview({ periodLabel: '月', rows: collect(checkins, days), totalDays: 30, plan, settings })
}

// ---- 防反弹状态判定（用于仪表盘预警横幅）----
export function reboundStatus(points, settings) {
  // points: [{ weight, avg }] 按日期升序
  if (!points.length) return { level: 'none', message: '暂无体重数据，完成首次打卡后开始监控' }
  const last = points[points.length - 1]
  const v = last.avg ?? last.weight
  const { safeZoneLow, safeZoneHigh, reboundLine } = settings
  if (reboundLine > 0 && v >= reboundLine) {
    return { level: 'danger', message: `7 日均线 ${v.toFixed(1)} kg 已触及反弹预警线 ${reboundLine} kg！请立即执行本周复盘中的纠偏措施。` }
  }
  if (safeZoneHigh > 0 && v > safeZoneHigh) {
    return { level: 'warn', message: `7 日均线 ${v.toFixed(1)} kg 已超出安全区间上限 ${safeZoneHigh} kg，处于缓冲区，请收紧本周热量执行。` }
  }
  if (safeZoneLow > 0 && v < safeZoneLow) {
    return { level: 'warn', message: `7 日均线 ${v.toFixed(1)} kg 低于安全区间下限 ${safeZoneLow} kg，减重过快，建议适当增加热量。` }
  }
  if (safeZoneLow > 0 && safeZoneHigh > 0) {
    return { level: 'ok', message: `7 日均线 ${v.toFixed(1)} kg，位于安全区间 ${safeZoneLow}–${safeZoneHigh} kg 内，状态良好。` }
  }
  return { level: 'none', message: '尚未设置安全体重区间，请前往「设置」配置防反弹监控' }
}
