// 专业动作链接库：训练方案中的专业名词 → fitwill.app 动作介绍页
// 直达链接均逐条人工验证；未验证的动作回退到锻炼库站内检索页（?q= 参数经测试可用）

const DIRECT_LINKS = {
  // —— 徒手方案 ——
  保加利亚分腿蹲: 'https://fitwill.app/zh-hans/exercise/3533/bulgarian-split-squat/',
  平板支撑: 'https://fitwill.app/zh-hans/exercise/2358/plank-butt-wrong-right/',
  靠墙静蹲: 'https://fitwill.app/zh-hans/exercise/6696/sit-wall/',
  俄罗斯转体: 'https://fitwill.app/zh-hans/exercise/2538/russian-twist/',
  凳上臂屈伸: 'https://fitwill.app/zh-hans/exercise/1399/bench-dip-on-floor/',
  俯卧撑: 'https://fitwill.app/zh-hans/exercise/0665/push-up/',
  波比跳: 'https://fitwill.app/zh-hans/exercise/1160/burpee/',
  开合跳: 'https://fitwill.app/zh-hans/exercise/0516/jumping-jack/',
  超人式: 'https://fitwill.app/zh-hans/exercise/3436/superman/',
  箭步蹲: 'https://fitwill.app/zh-hans/exercise/4959/lunge-thighs-wrong-right/',
  深蹲: 'https://fitwill.app/zh-hans/exercise/1197/squat/',
  臀桥: 'https://fitwill.app/zh-hans/exercise/0145/butt-bridge/',
  侧桥: 'https://fitwill.app/zh-hans/exercise/0705/side-bridge-version-2/',
  登山跑: 'https://fitwill.app/exercise/0630/mountain-climber',
  死虫式: 'https://fitwill.app/exercise/0276/dead-bug/',
  // —— 哑铃方案 ——
  罗马尼亚硬拉: 'https://fitwill.app/zh-hans/exercise/1459/dumbbell-romanian-deadlift/',
}

// 未逐条验证的动作：回退到锻炼库站内检索页
const SEARCH_TERMS = {
  哑铃地板卧推: 'dumbbell floor press',
  高脚杯深蹲: 'goblet squat',
  单臂划船: 'one arm dumbbell row',
  哑铃推举: 'dumbbell shoulder press',
  反向弓步: 'reverse lunge',
  俯身飞鸟: 'reverse fly',
  哑铃弯举: 'dumbbell bicep curl',
  哑铃深蹲: 'dumbbell squat',
  器械卧推: 'machine chest press',
  坐姿推肩: 'machine shoulder press',
  绳索下压: 'triceps pushdown',
  器械夹胸: 'chest fly machine',
  坐姿腿弯举: 'seated leg curl',
  坐姿划船: 'seated cable row',
  高位下拉: 'lat pulldown',
  髋外展: 'hip abduction',
  腿举: 'leg press',
  提踵: 'calf raise',
  面拉: 'face pull',
}

const searchUrl = (q) => `https://fitwill.app/zh-hans/exercises/1/?q=${encodeURIComponent(q)}`

export const EXERCISE_LINKS = {
  ...DIRECT_LINKS,
  ...Object.fromEntries(Object.entries(SEARCH_TERMS).map(([k, q]) => [k, searchUrl(q)])),
}

export function getExerciseLink(term) {
  return EXERCISE_LINKS[term] || null
}

// 最长词优先，避免「深蹲」抢先匹配「高脚杯深蹲 / 保加利亚分腿蹲」中的片段
const TERMS = Object.keys(EXERCISE_LINKS).sort((a, b) => b.length - a.length)

// 在动作文本（如「保加利亚分腿蹲 3×10/侧」）中匹配专业名词，
// 返回 [{ text, url? }] 片段，命中的名词带链接，其余为纯文本。
export function parseMove(move) {
  const text = String(move || '')
  for (const t of TERMS) {
    const i = text.indexOf(t)
    if (i >= 0) {
      return [
        { text: text.slice(0, i) },
        { text: t, url: EXERCISE_LINKS[t] },
        { text: text.slice(i + t.length) },
      ].filter((s) => s.text)
    }
  }
  return [{ text }]
}
