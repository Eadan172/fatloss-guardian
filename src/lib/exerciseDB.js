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

  // —— 分级动作库补充（K1 / K2 优先：新手实际会练到的动作最需要能点开看） ——
  // K1 无器械
  椅子深蹲: 'sit to stand',
  髋铰链触墙练习: 'hip hinge drill',
  蚌式开合: 'clamshell',
  侧卧抬腿: 'side lying leg raise',
  四足位后踢腿: 'donkey kick',
  墙面俯卧撑: 'wall push up',
  上斜俯卧撑: 'incline push up',
  毛巾划船: 'towel row',
  '俯卧 Y 字抬举': 'prone y raise',
  鸟狗式: 'bird dog',
  跪姿平板支撑: 'knee plank',
  跪姿侧平板: 'knee side plank',
  站姿提踵: 'standing calf raise',
  快走: 'brisk walking',
  原地踏步: 'marching in place',
  左右点步: 'step touch',
  负重臀桥: 'weighted glute bridge',
  坐姿器械划船: 'seated machine row',
  卧式单车: 'recumbent bike',
  椭圆机: 'elliptical trainer',
  跑步机走: 'treadmill walking',
  猫牛式: 'cat cow',
  颈肩环绕: 'neck shoulder roll',
  肩关节环绕: 'shoulder circles',
  手腕环绕: 'wrist circles',
  髋关节环绕: 'hip circles',
  踝关节活动: 'ankle mobility',
  前后摆腿: 'leg swings',
  门框胸肌拉伸: 'doorway chest stretch',
  髋屈肌拉伸: 'hip flexor stretch',
  腘绳肌拉伸: 'hamstring stretch',
  股四头肌拉伸: 'quad stretch',
  '4 字臀拉伸': 'figure four glute stretch',
  小腿拉伸: 'calf stretch',
  婴儿式: 'child pose',
  // K2 无器械 / 哑铃
  自重深蹲: 'bodyweight squat',
  相扑深蹲: 'sumo squat',
  后撤步箭步蹲: 'reverse lunge',
  台阶上步: 'step up',
  自重早安式: 'bodyweight good morning',
  跪姿俯卧撑: 'knee push up',
  侧平板支撑: 'side plank',
  卷腹: 'crunch',
  反向卷腹: 'reverse crunch',
  坡度走: 'incline walking',
  慢跑: 'jogging',
  爬楼梯: 'stair climbing',
  最伟大拉伸: 'worlds greatest stretch',
  农夫行走: 'farmers walk',
  哑铃后撤步箭步蹲: 'dumbbell reverse lunge',
  哑铃侧平举: 'dumbbell lateral raise',
  锤式弯举: 'hammer curl',
  哑铃臂屈伸: 'triceps kickback',
  哑铃耸肩: 'dumbbell shrug',
  坐姿腿屈伸: 'leg extension',
  器械臀推: 'hip thrust machine',
  山羊挺身: 'back extension',
  坐姿器械肩推: 'machine shoulder press',
  坐姿绳索划船: 'seated cable row',
  绳索弯举: 'cable curl',
  绳索面拉: 'cable face pull',
  跑步机坡度走: 'incline treadmill walk',
  划船机: 'rowing machine',

  // —— 分级动作库补充（K3 / K4 与健身房） ——
  // 注意：这些词都长于基础的「深蹲 / 硬拉 / 俯卧撑」，
  // parseMove 按词长降序匹配，因此「杠铃深蹲」不会被「深蹲」抢先命中。
  标准俯卧撑: 'push up',
  前弓步: 'forward lunge',
  深蹲跳: 'jump squat',
  单腿硬拉: 'single leg romanian deadlift',
  单腿臀桥: 'single leg glute bridge',
  仰卧举腿: 'lying leg raise',
  空心支撑: 'hollow body hold',
  派克俯卧撑: 'pike push up',
  桌下反向划船: 'inverted row',
  哑铃罗马尼亚硬拉: 'dumbbell romanian deadlift',
  上斜哑铃推举: 'incline dumbbell press',
  仰卧哑铃飞鸟: 'dumbbell fly',
  坐姿哑铃肩推: 'seated dumbbell shoulder press',
  俯身双哑铃划船: 'bent over dumbbell row',
  哑铃仰卧上拉: 'dumbbell pullover',
  颈后臂屈伸: 'overhead triceps extension',
  哑铃台阶上步: 'dumbbell step up',
  哑铃单腿硬拉: 'dumbbell single leg deadlift',
  哑铃深蹲推举: 'dumbbell thruster',
  坐姿器械推胸: 'machine chest press',
  杠铃深蹲: 'barbell back squat',
  杠铃硬拉: 'barbell deadlift',
  杠铃卧推: 'barbell bench press',
  杠铃划船: 'barbell row',
  史密斯深蹲: 'smith machine squat',
  绳索夹胸: 'cable crossover',
  辅助引体向上: 'assisted pull up',
  引体向上: 'pull up',
  绳索卷腹: 'cable crunch',
  悬垂举腿: 'hanging leg raise',
  单车间歇: 'bike intervals',
  爬楼机: 'stair machine',
  跑步机间歇: 'treadmill intervals',
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
