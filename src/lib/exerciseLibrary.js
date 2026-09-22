// ===================== 分级动作库 =====================
// 每个动作标注三项关键数据，由训练引擎按「真实水平 + 器械 + 伤病 + 体重基数」做闸门过滤：
//
//   minLevel —— 难度闸门（不是推荐值）
//     k1 = 零基础 / 久坐 / 运动中断半年以上 / 体重基数大 → 只用低冲击、易学、单关节负担小的动作
//     k2 = 有基础或复练（每周 1–2 次）→ 解锁标准自重动作
//     k3 = 规律训练 6 个月以上 → 解锁单腿、动态、需要稳定性的动作
//     k4 = 系统训练 1 年以上 → 解锁大重量复合、爆发、悬垂类动作
//
//   impact —— 关节冲击：low / mid / high
//     跳跃类动作落地瞬间的冲击可达体重的 3–4 倍，这是新手与大体重大用户最主要的受伤来源。
//
//   tags —— 禁忌标签：用户 limitations 命中任意一项 → 该动作被排除（而非降级使用）
//
// KEEP 等主流健身软件的 K1–K4 分级，与本库的 k1–k4 是同一套口径：
// K1 动作 = 靠墙静蹲、椅子深蹲、墙面俯卧撑、臀桥、快走；
// K4 动作 = 杠铃深蹲、硬拉、引体向上、波比跳、跑步机间歇。

export const LEVEL_ORDER = { k1: 1, k2: 2, k3: 3, k4: 4 }
export const IMPACT_ORDER = { low: 1, mid: 2, high: 3 }

export const LEVEL_LABEL = {
  k1: 'K1 · 零基础 / 短期使用者',
  k2: 'K2 · 有基础或复练',
  k3: 'K3 · 规律训练',
  k4: 'K4 · 长期系统训练',
}

export const LEVEL_DESC = {
  k1: '近 3 个月几乎不运动，或运动中断半年以上；爬 3 层楼会喘，标准俯卧撑做不到 3 个。',
  k2: '每周运动 1–2 次，或中断 1–3 个月想复练；能连续完成 3–8 个标准俯卧撑。',
  k3: '规律训练 6 个月以上，每周 3 次左右；能做 10 个以上标准俯卧撑、自重深蹲 20 个。',
  k4: '系统训练 1 年以上，熟悉杠铃深蹲 / 硬拉 / 卧推，有明确的自由重量训练经验。',
}

export const LEVEL_OPTIONS = [
  { value: 'k1', label: 'K1 · 零基础 / 短期使用者', hint: '几乎不运动，或中断半年以上' },
  { value: 'k2', label: 'K2 · 有基础或复练', hint: '每周 1–2 次，或中断 1–3 个月' },
  { value: 'k3', label: 'K3 · 规律训练', hint: '规律训练 6 个月以上' },
  { value: 'k4', label: 'K4 · 长期系统训练', hint: '系统训练 1 年以上，熟悉自由重量' },
]

export const PATTERN_LABEL = {
  squat: '下肢蹲',
  hinge: '下肢髋主导',
  push_h: '水平推',
  push_v: '垂直推',
  pull_h: '水平拉',
  pull_v: '垂直拉',
  core: '核心',
  glute: '臀部激活',
  arms: '手臂',
  calf: '小腿',
  cardio: '有氧',
  mobility: '活动度',
}

export const EXERCISES = [
  // ======================= 下肢：蹲（膝主导） =======================
  {
    id: 'chair_squat', name: '椅子深蹲（坐到起立）', en: 'Sit-to-Stand', pattern: 'squat',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '臀部先向后坐，屁股轻触椅面即站起，全程脚跟踩实、膝盖跟脚尖同向。',
    mistakes: '不要整个坐实再靠惯性弹起来，那样练到的是冲量而不是腿。',
    alt: '去掉椅子、控制下蹲深度即是自重深蹲。',
  },
  {
    id: 'wall_sit', name: '靠墙静蹲', en: 'Wall Sit', pattern: 'squat',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [], timed: true,
    cues: '背贴墙滑到膝盖约 100–120°，到大腿有灼热感即停，全程膝盖朝前不外翻。',
    mistakes: '蹲得过低让膝盖超过 90°，或膝盖内扣 —— 都容易引发膝前侧疼痛。',
    alt: '角度调浅、时间缩短即自动降难度；膝关节不适者以「无痛角度」为准。',
  },
  {
    id: 'bw_squat', name: '自重深蹲', en: 'Bodyweight Squat', pattern: 'squat',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['knee'],
    cues: '双脚与肩同宽略外八，髋部向后下坐至大腿接近水平，膝盖推向外侧跟脚尖同向。',
    mistakes: '膝内扣、脚跟离地、腰椎在底部失去中立（骨盆后倾）。',
  },
  {
    id: 'sumo_squat', name: '相扑深蹲', en: 'Sumo Squat', pattern: 'squat',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['knee'],
    cues: '脚尖外展 30–45°，下蹲时主动把膝盖向外推，底部感受臀部与大腿内侧发力。',
  },
  {
    id: 'reverse_lunge', name: '后撤步箭步蹲', en: 'Reverse Lunge', pattern: 'squat',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['knee', 'balance'],
    cues: '向后撤一大步，前腿小腿保持垂直地面，重心留在前脚，膝盖不越过脚尖太多。',
    alt: '不稳时扶墙或扶椅背，稳定性建立后再脱手。',
  },
  {
    id: 'step_up', name: '台阶上步', en: 'Step-Up', pattern: 'squat',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['knee', 'balance'],
    cues: '踩上台阶后用前腿把身体「推」上去，不要用后腿蹬地借力，下放时缓慢控制。',
    alt: '台阶越低越省力，从 20cm 开始。',
  },
  {
    id: 'lunge', name: '前弓步', en: 'Forward Lunge', pattern: 'squat',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['knee'],
    cues: '向前跨步下蹲，双膝都接近 90°，后膝轻触地面，起身时前脚发力。',
  },
  {
    id: 'bulgarian_split_squat', name: '保加利亚分腿蹲', en: 'Bulgarian Split Squat', pattern: 'squat',
    equip: ['none'], minLevel: 'k4', impact: 'mid', tags: ['knee', 'balance'],
    cues: '后脚搭在椅上，前腿承担约 80% 体重，身体微前倾，垂直下沉不要前后晃。',
  },
  {
    id: 'jump_squat', name: '深蹲跳', en: 'Jump Squat', pattern: 'squat',
    equip: ['none'], minLevel: 'k3', impact: 'high', tags: ['knee', 'ankle'],
    cues: '下蹲后向上跳起，落地时主动屈髋屈膝缓冲，落点安静无声说明缓冲到位。',
    mistakes: '落地直膝硬砸 —— 冲击可达体重的 3–4 倍，是膝踝损伤的高发动作。',
    alt: '体重基数大或膝踝不适者用「深蹲 + 提踵」替代。',
  },

  // ======================= 下肢：髋主导（后链） =======================
  {
    id: 'hip_hinge_touch', name: '髋铰链触墙练习', en: 'Hip Hinge Drill', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '距墙约一足远，臀部向后推去碰墙，膝盖微屈不动，感受大腿后侧被拉长。',
    mistakes: '弯腰（脊柱屈曲）而不是屈髋 —— 这是硬拉类动作最重要的前置技能。',
  },
  {
    id: 'glute_bridge', name: '臀桥', en: 'Glute Bridge', pattern: 'hinge',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '脚跟靠近臀部，用臀部把髋顶起来，顶点夹紧臀肌 1 秒，腰不要反弓。',
    mistakes: '用腰发力把身体「拱」起来，练完腰酸臀没感觉。',
  },
  {
    id: 'superman', name: '超人式（俯卧背伸）', en: 'Superman', pattern: 'hinge',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '俯卧同时抬起手臂与对侧腿，颈部保持中立不后仰，顶点停 1 秒再落下。',
  },
  {
    id: 'good_morning_bw', name: '自重早安式', en: 'Bodyweight Good Morning', pattern: 'hinge',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['lowback'],
    cues: '双手扶后脑，以髋为轴俯身至躯干接近水平，全程腰背绷直不塌。',
  },
  {
    id: 'single_leg_rdl_bw', name: '单腿硬拉（徒手）', en: 'Single-Leg RDL', pattern: 'hinge',
    equip: ['none'], minLevel: 'k3', impact: 'low', tags: ['balance'],
    cues: '单腿站立，另一腿向后伸，躯干与后腿保持一条直线俯身，髋部不要外翻。',
    alt: '手扶墙或椅背降低平衡要求。',
  },

  // ======================= 臀与髋激活 =======================
  {
    id: 'clamshell', name: '蚌式开合', en: 'Clamshell', pattern: 'glute',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '侧卧屈膝、脚跟并拢，像贝壳一样打开上侧膝盖，骨盆不要向后翻。',
    mistakes: '靠转骨盆完成动作，臀中肌其实没参与。',
  },
  {
    id: 'side_lying_leg_raise', name: '侧卧抬腿', en: 'Side-Lying Leg Raise', pattern: 'glute',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '侧卧下侧腿微屈，上侧腿伸直向上抬起至约 45°，脚尖朝前不要外翻。',
  },
  {
    id: 'donkey_kick', name: '四足位后踢腿', en: 'Donkey Kick', pattern: 'glute',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['wrist'],
    cues: '四足跪姿，屈膝 90° 向后上方顶，靠臀部发力，腰不要塌。',
    alt: '手腕不适者可改用俯卧屈膝后踢。',
  },
  {
    id: 'single_leg_bridge', name: '单腿臀桥', en: 'Single-Leg Glute Bridge', pattern: 'glute',
    equip: ['none'], minLevel: 'k3', impact: 'low', tags: [],
    cues: '一条腿伸直抬起，另一腿脚跟蹬地顶髋，骨盆保持水平不歪斜。',
  },

  // ======================= 水平推 =======================
  {
    id: 'wall_pushup', name: '墙面俯卧撑', en: 'Wall Push-Up', pattern: 'push_h',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '手撑墙与肩同高，身体从头到脚成一条直线，肘部与躯干约 45° 夹角下压。',
    alt: '脚离墙越远越难，逐步过渡到下斜撑桌面。',
  },
  {
    id: 'incline_pushup', name: '上斜俯卧撑（撑桌/台阶）', en: 'Incline Push-Up', pattern: 'push_h',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['wrist'],
    cues: '手撑桌面或台阶，越高越省力，全身绷成一条直线，胸口贴近支撑面再推起。',
    mistakes: '塌腰或撅臀，把动作做成了「身体折叠」。',
    alt: '支撑面由高到低逐步进阶，是俯卧撑最安全的入门路径。',
  },
  {
    id: 'knee_pushup', name: '跪姿俯卧撑', en: 'Knee Push-Up', pattern: 'push_h',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['wrist'],
    cues: '膝盖着地，从膝到肩保持一条直线，下放至胸口接近地面再推起。',
  },
  {
    id: 'pushup', name: '标准俯卧撑', en: 'Push-Up', pattern: 'push_h',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['wrist', 'shoulder'],
    cues: '核心收紧、臀部夹紧，下放时大臂约与躯干呈 45°，最低点胸口离地一拳。',
  },

  // ======================= 水平拉 / 垂直推 / 垂直拉 =======================
  {
    id: 'towel_row', name: '毛巾划船（绕门柱/立柱）', en: 'Towel Row', pattern: 'pull_h',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['shoulder'],
    cues: '毛巾绕稳固定柱，双手拉住、身体后倾，用背部把胸口拉向柱子：肩胛先向后收，再带动手臂。',
    mistakes: '只用手臂拉、肩胛完全不动；或后倾角度过大导致腰部代偿。',
    alt: '后倾角度越小越省力，先从几乎直立开始，只做「肩胛后收」也算完成一次。这是零器械条件下唯一的真实水平拉动作。',
  },
  {
    id: 'prone_y_raise', name: '俯卧 Y 字抬举', en: 'Prone Y-Raise', pattern: 'pull_h',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '俯卧，手臂呈 Y 字向前上方抬起，靠肩胛骨下方发力，不要耸肩。',
    alt: '这是肩胛稳定与下斜方肌的辅助动作，不能替代划船类拉动作。',
  },
  {
    id: 'pike_pushup', name: '派克俯卧撑', en: 'Pike Push-Up', pattern: 'push_v',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['shoulder', 'wrist'],
    cues: '臀部抬高成倒 V 字，头朝双手中点前下方落，用肩部推起。',
    alt: '肩部力量不足时可改做靠墙版本的肩部推举。',
  },
  {
    id: 'table_row', name: '桌下反向划船', en: 'Table Row', pattern: 'pull_h',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['shoulder', 'lowback'],
    cues: '仰卧握桌沿，身体绷直，胸口拉向桌沿，全程臀部不塌。',
    alt: '屈膝、脚掌踩地可显著降低难度。',
  },

  // ======================= 核心 =======================
  {
    id: 'dead_bug', name: '死虫式', en: 'Dead Bug', pattern: 'core',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '仰卧屈膝屈髋，对侧手脚缓慢伸展，全程腰部贴地不拱起。',
    mistakes: '为了伸得更远而让腰离地 —— 说明已超出可控范围，缩短幅度。',
  },
  {
    id: 'bird_dog', name: '鸟狗式', en: 'Bird Dog', pattern: 'core',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['wrist'],
    cues: '四足位对角伸展，腰背保持水平，别翘臀，顶点停 2 秒。',
  },
  {
    id: 'plank_knee', name: '跪姿平板支撑', en: 'Knee Plank', pattern: 'core',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['wrist'], timed: true,
    cues: '膝盖着地，从膝到肩成一条直线，收腹夹臀，不要塌腰。',
    alt: '手腕不适可改用肘撑（前臂跪姿平板）。',
  },
  {
    id: 'side_plank_knee', name: '跪姿侧平板', en: 'Knee Side Plank', pattern: 'core',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['wrist'], timed: true,
    cues: '侧卧用肘与膝支撑，髋部向上顶起成一条直线，别让髋部掉下去。',
  },
  {
    id: 'plank', name: '平板支撑', en: 'Plank', pattern: 'core',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['wrist'], timed: true,
    cues: '肘在肩正下方，收腹夹臀，从头到脚跟成一条直线。',
    mistakes: '塌腰翘臀、憋气 —— 应当保持均匀呼吸。',
  },
  {
    id: 'side_plank', name: '侧平板支撑', en: 'Side Plank', pattern: 'core',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['wrist', 'shoulder'], timed: true,
    cues: '侧卧肘撑，双脚叠放，髋部顶高，耳朵到脚踝成一条直线。',
  },
  {
    id: 'crunch', name: '卷腹', en: 'Crunch', pattern: 'core',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['lowback'],
    cues: '只把肩胛骨抬离地面，下巴与胸口保持一拳距离，呼气时收缩腹部。',
    mistakes: '用手抱头使劲拉脖子，或整个背部离地变成仰卧起坐。',
  },
  {
    id: 'reverse_crunch', name: '反向卷腹', en: 'Reverse Crunch', pattern: 'core',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: [],
    cues: '用腹部把骨盆卷向胸口，双腿是被带动的，不是主动甩腿。',
  },
  {
    id: 'leg_raise', name: '仰卧举腿', en: 'Leg Raise', pattern: 'core',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['lowback'],
    cues: '腰部始终贴地，双腿下放到腰即将离地的位置就停住再抬起。',
    mistakes: '腿下放过低导致腰椎代偿，练完腰疼 —— 幅度以腰不离地为上限。',
    alt: '屈膝做（屈膝举腿）可显著降低腰部压力。',
  },
  {
    id: 'hollow_hold', name: '空心支撑', en: 'Hollow Body Hold', pattern: 'core',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['lowback'], timed: true,
    cues: '仰卧把手脚抬起，腰部压向地面成「香蕉形」，全程腰部不出现空隙。',
    alt: '屈膝、手臂放身体两侧是标准退阶。',
  },
  {
    id: 'mountain_climber', name: '登山跑', en: 'Mountain Climber', pattern: 'core',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['wrist', 'knee'],
    cues: '高平板姿态，交替把膝盖快速带向胸口，臀部保持稳定不上下起伏。',
    alt: '慢速版（原地交替提膝）可从 k2 起作为有氧入门。',
  },
  {
    id: 'russian_twist', name: '俄罗斯转体', en: 'Russian Twist', pattern: 'core',
    equip: ['none'], minLevel: 'k3', impact: 'mid', tags: ['lowback'],
    cues: '上身后倾约 45°，转的是胸椎而不是手臂，左右各算一次。',
  },
  {
    id: 'calf_raise', name: '站姿提踵', en: 'Calf Raise', pattern: 'calf',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '踮到最高点停 1 秒再缓慢落下，可扶墙保持平衡，全幅度比多次数重要。',
  },

  // ======================= 有氧 / 心肺 =======================
  {
    id: 'walk', name: '快走', en: 'Brisk Walk', pattern: 'cardio',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '步频加快、步幅自然，强度以「能开口说话但唱不了歌」为准，全程鼻吸口呼。',
    mistakes: '走得慢到心率上不去 —— 减脂有氧的关键是持续的中等强度，不是散步。',
  },
  {
    id: 'march_in_place', name: '原地踏步（提膝）', en: 'Marching in Place', pattern: 'cardio',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '原地交替抬膝至大腿接近水平，手臂自然摆动，前脚掌先落地。',
    alt: '膝踝不适者降低抬膝高度，保持连续即可。',
  },
  {
    id: 'step_touch', name: '左右点步', en: 'Step Touch', pattern: 'cardio',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['balance'],
    cues: '左右侧向点步并配合手臂摆动，重心保持稳定，可扶墙进行。',
  },
  {
    id: 'incline_walk', name: '坡度走（上坡/跑步机坡度）', en: 'Incline Walk', pattern: 'cardio',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['ankle'],
    cues: '坡度 5–10%，速度保持能说话的程度，手握扶手会显著降低消耗，尽量不扶。',
  },
  {
    id: 'jog', name: '慢跑', en: 'Jog', pattern: 'cardio',
    equip: ['none'], minLevel: 'k2', impact: 'mid', tags: ['knee', 'ankle', 'cardio'],
    cues: '步频约 170–180 步/分，落地轻、步幅小，用「能说话」的强度跑。',
    alt: '膝踝不适或体重基数大时，先用快走或坡度走替代，等体重下降再加跑量。',
  },
  {
    id: 'jumping_jack', name: '开合跳', en: 'Jumping Jack', pattern: 'cardio',
    equip: ['none'], minLevel: 'k2', impact: 'high', tags: ['knee', 'ankle'],
    cues: '落地时膝盖微屈缓冲，手臂过头时不要耸肩。',
    alt: '低冲击版：去掉跳跃，改为左右侧点步 + 手臂开合。',
  },
  {
    id: 'stair_climb', name: '爬楼梯', en: 'Stair Climb', pattern: 'cardio',
    equip: ['none'], minLevel: 'k2', impact: 'mid', tags: ['knee', 'cardio'],
    cues: '全脚掌踩实台阶，身体微前倾，上楼发力、下楼慢走（下楼对膝盖冲击大于上楼）。',
  },
  {
    id: 'jump_rope', name: '跳绳', en: 'Jump Rope', pattern: 'cardio',
    equip: ['none'], minLevel: 'k3', impact: 'high', tags: ['knee', 'ankle'],
    cues: '手腕摇绳、前脚掌轻落地，跳起高度只要刚过绳即可，别追求跳得高。',
    alt: '体重基数大或膝踝不适者不安排跳绳，改用原地踏步或坡度走。',
  },
  {
    id: 'burpee', name: '波比跳', en: 'Burpee', pattern: 'cardio',
    equip: ['none'], minLevel: 'k4', impact: 'high', tags: ['knee', 'ankle', 'wrist', 'shoulder', 'cardio'],
    cues: '下蹲撑地 → 后跳成平板 → 收腿站起跳，全程保持核心收紧。',
    mistakes: '把它当热身动作使用 —— 波比跳对心肺与关节要求都很高，不适合零基础。',
  },

  // ======================= 关节活动度与拉伸 =======================
  {
    id: 'cat_cow', name: '猫牛式', en: 'Cat-Cow', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['wrist'],
    cues: '四足位交替拱背与塌腰，配合呼吸，活动幅度以无痛为限。',
  },
  {
    id: 'neck_shoulder_roll', name: '颈肩环绕', en: 'Neck & Shoulder Roll', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '缓慢画圈，颈部不要快速甩动或绕到疼痛的角度。',
  },
  {
    id: 'arm_circle', name: '肩关节环绕', en: 'Arm Circle', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '由小到大画圈，前后各一组，是上肢训练前最省时的热身。',
  },
  {
    id: 'wrist_circle', name: '手腕环绕', en: 'Wrist Circle', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '十指交叉缓慢转动，为撑地类动作（俯卧撑/平板）做准备。',
  },
  {
    id: 'hip_circle', name: '髋关节环绕', en: 'Hip Circle', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '扶墙单腿站立，髋部由内向外画圈，两侧各 10 次。',
  },
  {
    id: 'ankle_mobility', name: '踝关节活动', en: 'Ankle Mobility', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '脚尖点地画圈，再做前后压踝，踝背屈不足会直接影响深蹲深度。',
  },
  {
    id: 'leg_swing', name: '前后摆腿', en: 'Leg Swing', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['balance'],
    cues: '扶墙稳定身体，腿放松前后自然摆动，幅度逐渐加大。',
  },
  {
    id: 'chest_opener', name: '门框胸肌拉伸', en: 'Doorway Chest Stretch', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '前臂贴门框，身体缓慢前移，感受胸前拉伸，保持 30 秒，不要弹震。',
  },
  {
    id: 'hip_flexor_stretch', name: '髋屈肌拉伸', en: 'Hip Flexor Stretch', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '半跪姿，骨盆后倾（微收腹）再向前移髋，才能真的拉到髂腰肌。',
  },
  {
    id: 'hamstring_stretch', name: '腘绳肌拉伸', en: 'Hamstring Stretch', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '坐姿或站姿直腿勾脚，从髋部前倾，腰背保持挺直，30 秒不弹震。',
  },
  {
    id: 'quad_stretch', name: '股四头肌拉伸', en: 'Quad Stretch', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: ['balance'],
    cues: '站立扶墙，手抓同侧脚踝拉向臀部，膝盖并拢，骨盆保持中立。',
  },
  {
    id: 'glute_stretch', name: '4 字臀拉伸', en: 'Figure-4 Glute Stretch', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '仰卧把一侧脚踝搭在对侧膝上，双手抱大腿后侧拉向胸口。',
  },
  {
    id: 'calf_stretch', name: '小腿拉伸', en: 'Calf Stretch', pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '弓步推墙，后腿伸直脚跟踩实地面，感受小腿后侧拉伸。',
  },
  {
    id: 'child_pose', name: '婴儿式', en: "Child's Pose", pattern: 'mobility',
    equip: ['none'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '跪坐后身体前趴、手臂前伸，配合深呼吸放松腰背。',
  },
  {
    id: 'world_greatest_stretch', name: '最伟大拉伸', en: "World's Greatest Stretch", pattern: 'mobility',
    equip: ['none'], minLevel: 'k2', impact: 'low', tags: ['balance', 'knee'],
    cues: '弓步位同侧手撑地、肘向内侧下沉，再向上转体打开胸口，一次串起髋胸椎。',
  },

  // ======================= 哑铃 =======================
  {
    id: 'db_glute_bridge', name: '负重臀桥', en: 'Weighted Glute Bridge', pattern: 'hinge',
    equip: ['dumbbell'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '哑铃横放在髋部并用双手固定，用臀部发力顶髋，腰不要反弓代偿。',
  },
  {
    id: 'db_rdl', name: '哑铃罗马尼亚硬拉', en: 'Dumbbell RDL', pattern: 'hinge',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['lowback'],
    cues: '膝盖微屈固定角度，臀部向后推，哑铃贴大腿下滑，感受腿后侧拉长再站起。',
    mistakes: '把它做成了蹲 —— 膝盖大幅屈伸就不是髋主导动作了。',
    alt: '先用最轻的哑铃或空手练习髋铰链轨迹，轨迹稳定再加重量。',
  },
  {
    id: 'farmer_walk', name: '农夫行走', en: "Farmer's Walk", pattern: 'core',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['lowback'],
    cues: '双手等重哑铃走直线，肩胛下沉、核心收紧，别含胸或左右摇晃。',
  },
  {
    id: 'db_goblet_squat', name: '高脚杯深蹲', en: 'Goblet Squat', pattern: 'squat',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['knee'],
    cues: '哑铃竖抱胸前、手肘贴身体，下蹲时手肘走到大腿内侧之间，重量带来的前配重会帮你保持直立。',
  },
  {
    id: 'db_reverse_lunge', name: '哑铃后撤步箭步蹲', en: 'Dumbbell Reverse Lunge', pattern: 'squat',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['knee', 'balance'],
    cues: '哑铃自然垂于身侧，后撤步下沉，前腿蹬地起身，躯干保持直立。',
  },
  {
    id: 'db_floor_press', name: '哑铃地板卧推', en: 'Dumbbell Floor Press', pattern: 'push_h',
    equip: ['dumbbell'], minLevel: 'k1', impact: 'low', tags: ['shoulder'],
    cues: '仰卧屈膝，上臂触地即停止下放，比平凳卧推少了肩关节过度外展的风险。',
  },
  {
    id: 'db_bench_press', name: '哑铃卧推（平凳）', en: 'Dumbbell Bench Press', pattern: 'push_h',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'mid', tags: ['shoulder'],
    cues: '肩胛骨后缩下沉贴凳，哑铃沿弧线下放到胸口两侧，推起时不要碰撞。',
  },
  {
    id: 'db_incline_press', name: '上斜哑铃推举', en: 'Incline Dumbbell Press', pattern: 'push_h',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'mid', tags: ['shoulder'],
    cues: '凳面 30° 左右，重点在上胸，肘部略低于躯干平面即可，不必过深。',
  },
  {
    id: 'db_fly', name: '仰卧哑铃飞鸟', en: 'Dumbbell Fly', pattern: 'push_h',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'low', tags: ['shoulder'],
    cues: '手肘保持微屈固定，像抱树一样打开再合拢，重量宜轻，感受胸部拉伸。',
  },
  {
    id: 'db_lateral_raise', name: '哑铃侧平举', en: 'Dumbbell Lateral Raise', pattern: 'push_v',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['shoulder'],
    cues: '手肘微屈，抬到与肩同高即停，想象「向外倒水」，不要用斜方肌耸肩代偿。',
    mistakes: '重量过大导致用躯干摆动借力，侧平举是典型的轻重量动作。',
  },
  {
    id: 'db_ohp', name: '坐姿哑铃肩推', en: 'Seated Dumbbell Shoulder Press', pattern: 'push_v',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'mid', tags: ['shoulder', 'lowback'],
    cues: '靠背支撑、核心收紧，哑铃从耳侧推到头顶上方，肘部不要完全锁死。',
  },
  {
    id: 'db_one_arm_row', name: '单臂哑铃划船', en: 'One-Arm Dumbbell Row', pattern: 'pull_h',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['lowback', 'wrist'],
    cues: '一手撑凳，肩胛先向后收再拉哑铃到髋侧，躯干不要跟着旋转。',
  },
  {
    id: 'db_bent_row', name: '俯身双哑铃划船', en: 'Bent-Over Dumbbell Row', pattern: 'pull_h',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'low', tags: ['lowback'],
    cues: '髋铰链俯身约 45°，腰背绷直，双哑铃拉向腹部两侧。',
  },
  {
    id: 'db_reverse_fly', name: '俯身飞鸟', en: 'Bent-Over Reverse Fly', pattern: 'pull_h',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['lowback'],
    cues: '俯身微屈膝，手臂微屈向两侧打开，感受上背与后束肩发力，重量宜轻。',
  },
  {
    id: 'db_pullover', name: '哑铃仰卧上拉', en: 'Dumbbell Pullover', pattern: 'pull_v',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'low', tags: ['shoulder'],
    cues: '仰卧双手托哑铃从胸上方缓慢过头下放至有拉伸感，肘部保持微屈。',
  },
  {
    id: 'db_curl', name: '哑铃弯举', en: 'Dumbbell Curl', pattern: 'arms',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: [],
    cues: '大臂贴紧身侧固定，只让前臂移动，顶点略停，下放用 2 秒控制。',
  },
  {
    id: 'hammer_curl', name: '锤式弯举', en: 'Hammer Curl', pattern: 'arms',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: [],
    cues: '掌心相对握铃，肘部不外张，对前臂与肱桡肌刺激更好。',
  },
  {
    id: 'db_kickback', name: '哑铃臂屈伸（后踢）', en: 'Dumbbell Kickback', pattern: 'arms',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['wrist'],
    cues: '俯身大臂贴紧躯干并固定，仅小臂向后伸直，顶点停 1 秒。',
  },
  {
    id: 'db_triceps_ext', name: '颈后臂屈伸', en: 'Overhead Triceps Extension', pattern: 'arms',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'low', tags: ['shoulder', 'wrist'],
    cues: '双手握哑铃举过头，肘部朝前不外张，仅小臂移动。',
  },
  {
    id: 'db_shrug', name: '哑铃耸肩', en: 'Dumbbell Shrug', pattern: 'pull_h',
    equip: ['dumbbell'], minLevel: 'k2', impact: 'low', tags: ['shoulder'],
    cues: '肩峰垂直向上顶，不要绕圈，顶点停 1 秒再缓慢落下。',
  },
  {
    id: 'db_step_up', name: '哑铃台阶上步', en: 'Dumbbell Step-Up', pattern: 'squat',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'low', tags: ['knee', 'balance'],
    cues: '哑铃垂于身侧，前腿发力把身体推上去，下放缓慢控制不砸地。',
  },
  {
    id: 'db_sldl', name: '哑铃单腿硬拉', en: 'Dumbbell Single-Leg RDL', pattern: 'hinge',
    equip: ['dumbbell'], minLevel: 'k3', impact: 'low', tags: ['balance', 'lowback'],
    cues: '单腿站立，另一腿后伸，哑铃沿前腿下滑，髋部保持水平不外翻。',
  },
  {
    id: 'db_thruster', name: '哑铃深蹲推举', en: 'Dumbbell Thruster', pattern: 'squat',
    equip: ['dumbbell'], minLevel: 'k4', impact: 'mid', tags: ['knee', 'shoulder', 'lowback', 'cardio'],
    cues: '深蹲起身的动量顺势把哑铃推到头顶，动作连贯不停顿。',
  },

  // ======================= 健身房：固定器械与杠铃 =======================
  {
    id: 'machine_chest_press', name: '坐姿器械推胸', en: 'Machine Chest Press', pattern: 'push_h',
    equip: ['gym'], minLevel: 'k1', impact: 'low', tags: ['shoulder'],
    cues: '手柄与胸口同高，肩胛贴靠背，推到手肘接近伸直即可，不要锁死顶肘。',
    alt: '轨迹固定、无需平衡，是零基础上肢推的第一选择。',
  },
  {
    id: 'machine_row', name: '坐姿器械划船', en: 'Machine Row', pattern: 'pull_h',
    equip: ['gym'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '胸垫或靠背贴稳，肩胛先收再拉，拉到腹部两侧，不要靠身体后仰借力。',
  },
  {
    id: 'recumbent_bike', name: '卧式单车', en: 'Recumbent Bike', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '座椅调到腿近乎伸直的位置，保持每分钟 70–90 转，强度以能说话为准。',
    alt: '对膝腰压力最小的有氧器械，体重基数大者优先选它。',
  },
  {
    id: 'elliptical', name: '椭圆机', en: 'Elliptical', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '脚掌全掌踩实，靠腿部发力而不是用双臂猛推手柄。',
  },
  {
    id: 'treadmill_walk', name: '跑步机走', en: 'Treadmill Walk', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k1', impact: 'low', tags: [],
    cues: '速度 5–6km/h，坡度 0–3%，尽量不扶扶手（扶了消耗会掉约 20%）。',
  },
  {
    id: 'leg_press', name: '腿举', en: 'Leg Press', pattern: 'squat',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['knee'],
    cues: '脚与肩同宽踩实踏板，下放到膝盖约 90° 即推起，膝盖永远不要锁死。',
    mistakes: '下放过深导致骨盆离开靠背（腰椎屈曲），这是腿举最常见的受伤原因。',
  },
  {
    id: 'leg_extension', name: '坐姿腿屈伸', en: 'Leg Extension', pattern: 'squat',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: [],
    cues: '膝盖对准转轴，伸到接近伸直停 1 秒，下放控制 2 秒。',
  },
  {
    id: 'leg_curl', name: '坐姿腿弯举', en: 'Seated Leg Curl', pattern: 'hinge',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: [],
    cues: '膝盖对准转轴、大腿被压紧固定，只用小腿把重量勾下来。',
  },
  {
    id: 'hip_thrust_machine', name: '器械臀推', en: 'Hip Thrust Machine', pattern: 'glute',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: [],
    cues: '靠背贴稳、下巴微收，用臀部顶起，顶点骨盆不过度后倾。',
  },
  {
    id: 'back_extension', name: '山羊挺身', en: 'Back Extension', pattern: 'hinge',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['lowback'],
    cues: '起身到躯干与腿成一条直线即停，不要过度后仰挤压腰椎。',
  },
  {
    id: 'machine_shoulder_press', name: '坐姿器械肩推', en: 'Machine Shoulder Press', pattern: 'push_v',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['shoulder'],
    cues: '背贴靠垫，推到头顶上方，下放到手肘略低于肩即可。',
  },
  {
    id: 'lat_pulldown', name: '高位下拉', en: 'Lat Pulldown', pattern: 'pull_v',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['shoulder'],
    cues: '先沉肩再下拉，把横杆拉到锁骨附近，躯干后倾不超过 15°。',
    mistakes: '靠身体大幅后仰把杆「摇」下来，背阔肌其实没怎么参与。',
  },
  {
    id: 'cable_row', name: '坐姿绳索划船', en: 'Seated Cable Row', pattern: 'pull_h',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['lowback'],
    cues: '躯干保持稳定，肩胛后缩带动手臂，拉到腹部后略停。',
  },
  {
    id: 'barbell_row', name: '杠铃划船', en: 'Barbell Row', pattern: 'pull_h',
    equip: ['gym'], minLevel: 'k4', impact: 'mid', tags: ['lowback'],
    cues: '髋铰链俯身约 45°，腰背绷直不塌，杠铃拉向肚脐附近，肩胛主动后缩。',
    mistakes: '靠躯干反复起身把杠铃「甩」上去 —— 重量越大越要做成腰在发力。',
    alt: '腰椎有压力时改用「胸撑划船」（胸部贴住上斜凳）可显著降低腰部负荷。',
  },
  {
    id: 'cable_face_pull', name: '绳索面拉', en: 'Cable Face Pull', pattern: 'pull_h',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['shoulder'],
    cues: '拉向面部并向外打开，肘高于手腕，对圆肩与肩健康特别有价值。',
  },
  {
    id: 'cable_pushdown', name: '绳索下压', en: 'Cable Pushdown', pattern: 'arms',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['wrist'],
    cues: '大臂夹紧身侧固定不动，只让小臂向下伸直，末端略停。',
  },
  {
    id: 'cable_curl', name: '绳索弯举', en: 'Cable Curl', pattern: 'arms',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: [],
    cues: '绳索全程张力不断，大臂固定，避免用腰摆动。',
  },
  {
    id: 'incline_treadmill', name: '跑步机坡度走', en: 'Incline Treadmill Walk', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k2', impact: 'low', tags: ['ankle'],
    cues: '坡度 8–12%、速度 4.5–5.5km/h，挺胸不要一直盯着脚下。',
  },
  {
    id: 'rowing_machine', name: '划船机', en: 'Rowing Machine', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k2', impact: 'mid', tags: ['lowback'],
    cues: '发力顺序是腿 → 髋 → 手，回程顺序手 → 髋 → 腿，别用手臂先拉。',
  },
  {
    id: 'smith_squat', name: '史密斯深蹲', en: 'Smith Machine Squat', pattern: 'squat',
    equip: ['gym'], minLevel: 'k3', impact: 'low', tags: ['knee'],
    cues: '脚踩到身体略前的位置，轨迹固定但不要靠器械「坐着」完成。',
  },
  {
    id: 'cable_fly', name: '绳索夹胸', en: 'Cable Crossover', pattern: 'push_h',
    equip: ['gym'], minLevel: 'k3', impact: 'low', tags: ['shoulder'],
    cues: '手肘保持微屈固定，双手在胸前交叉略停，全程感受胸肌持续张力。',
  },
  {
    id: 'assisted_pullup', name: '辅助引体向上', en: 'Assisted Pull-Up', pattern: 'pull_v',
    equip: ['gym'], minLevel: 'k3', impact: 'low', tags: ['shoulder', 'wrist'],
    cues: '配重越大越省力，先沉肩再把胸口拉向横杆，下放 2–3 秒控制。',
    alt: '引体做不到时，辅助引体是最高效的过渡方式，比单纯高位下拉更接近目标动作。',
  },
  {
    id: 'cable_crunch', name: '绳索卷腹', en: 'Cable Crunch', pattern: 'core',
    equip: ['gym'], minLevel: 'k3', impact: 'low', tags: ['lowback'],
    cues: '跪姿、髋角固定不动，用腹部把胸腔卷向骨盆，不是用手臂拉绳。',
  },
  {
    id: 'bike_intervals', name: '单车间歇', en: 'Bike Intervals', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k3', impact: 'mid', tags: ['cardio'],
    cues: '快 1 分钟（RPE 8）+ 慢 2 分钟（RPE 4）为一组，比长时间低强度更省时间。',
  },
  {
    id: 'stair_machine', name: '爬楼机', en: 'Stair Machine', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k3', impact: 'mid', tags: ['knee', 'cardio'],
    cues: '全脚掌踩实，身体直立不要趴在扶手上，靠腿把台阶压下去。',
  },
  {
    id: 'barbell_squat', name: '杠铃深蹲', en: 'Barbell Back Squat', pattern: 'squat',
    equip: ['gym'], minLevel: 'k4', impact: 'mid', tags: ['knee', 'lowback'],
    cues: '杠铃压在斜方肌上（不是颈椎），吸气收紧核心，髋膝同时启动下蹲。',
  },
  {
    id: 'barbell_deadlift', name: '杠铃硬拉', en: 'Barbell Deadlift', pattern: 'hinge',
    equip: ['gym'], minLevel: 'k4', impact: 'mid', tags: ['lowback', 'knee'],
    cues: '杠铃贴近小腿，先把「腋窝夹紧、核心绷紧」，再靠腿部推地把杠铃沿腿拉起。',
    mistakes: '用腰先发力把杠铃「拽」起来 —— 这是腰椎间盘损伤的高风险动作模式。',
  },
  {
    id: 'barbell_bench', name: '杠铃卧推', en: 'Barbell Bench Press', pattern: 'push_h',
    equip: ['gym'], minLevel: 'k4', impact: 'mid', tags: ['shoulder', 'wrist'],
    cues: '肩胛后缩下沉锁定，杠铃落在乳头连线附近，手腕保持中立不后折。',
  },
  {
    id: 'pullup', name: '引体向上', en: 'Pull-Up', pattern: 'pull_v',
    equip: ['gym'], minLevel: 'k4', impact: 'mid', tags: ['shoulder', 'wrist'],
    cues: '从静止悬垂开始，沉肩后拉，下巴过杠，下放控制不甩。',
  },
  {
    id: 'hanging_leg_raise', name: '悬垂举腿', en: 'Hanging Leg Raise', pattern: 'core',
    equip: ['gym'], minLevel: 'k4', impact: 'mid', tags: ['shoulder', 'wrist', 'lowback'],
    cues: '避免前后摆荡，用腹部把骨盆向后卷起，腿只是被带动的。',
  },
  {
    id: 'treadmill_intervals', name: '跑步机间歇', en: 'Treadmill Intervals', pattern: 'cardio',
    equip: ['gym'], minLevel: 'k4', impact: 'high', tags: ['knee', 'ankle', 'cardio'],
    cues: '快跑 30–60 秒（RPE 8–9）+ 慢走 90 秒，总时长控制在 20 分钟内。',
  },
]

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id) {
  return BY_ID.get(id)
}

// 器械可用性：自重动作人人可做；健身房隐含拥有哑铃
export function canUseEquipment(ex, equip) {
  if (ex.equip.includes('none')) return true
  if (equip === 'gym') return ex.equip.includes('gym') || ex.equip.includes('dumbbell')
  if (equip === 'dumbbell') return ex.equip.includes('dumbbell')
  return false
}

// 禁忌命中即排除（而非降级使用）
export function isBlocked(ex, limitations) {
  if (!limitations || limitations.length === 0) return false
  return ex.tags.some((t) => limitations.includes(t))
}

export const LIMITATION_LABEL = {
  knee: '膝关节', lowback: '腰椎', shoulder: '肩关节',
  wrist: '手腕', ankle: '踝关节', cardio: '心肺', balance: '平衡能力',
}

export const LIMITATION_OPTIONS = [
  { value: 'knee', label: '膝关节不适', hint: '排除跳跃、深蹲到底与弓步类动作' },
  { value: 'lowback', label: '腰椎 / 下背不适', hint: '排除大重量髋铰链与卷腹举腿类' },
  { value: 'shoulder', label: '肩关节不适', hint: '排除过顶推举与大幅度肩外展' },
  { value: 'wrist', label: '手腕不适', hint: '排除手掌撑地类（俯卧撑 / 平板）' },
  { value: 'ankle', label: '踝关节不适', hint: '排除跳跃与坡度过大的有氧' },
  { value: 'cardio', label: '心肺功能受限', hint: '排除高强度间歇与波比跳' },
  { value: 'balance', label: '平衡能力较差', hint: '排除无支撑的单腿动作' },
]

export const SESSION_MINUTE_OPTIONS = [
  { value: 20, label: '20 分钟（时间很紧）' },
  { value: 30, label: '30 分钟（推荐起步）' },
  { value: 45, label: '45 分钟' },
  { value: 60, label: '60 分钟以上' },
]
