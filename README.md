# 减重守护台 · FatLoss Guardian

本地优先（Local-First）的个人减重与防反弹 Dashboard 工作台。**数据 100% 存储于本机浏览器 localStorage，零网络传输、零第三方 API**。支持 JSON 完整备份 / 导入恢复，跨设备无损迁移。

技术栈：Vite + React 18 + TailwindCSS · 图表为手写 SVG（无任何图表库依赖）· 无后端

---

## 一、开源选型对比结论

针对「防反弹监控 + 周期复盘 + 100% 本地化」三项硬需求，评估了两个最相关的 MIT 开源项目：

| 维度 | Townzc/liftcut-tracker（102★） | Cawlumm/lyftr（320★） |
|---|---|---|
| 技术栈 | Next.js + Supabase（Auth/Postgres/RLS） | Go + Gin + SQLite 后端，React + TS + Tailwind + Vite 前端 |
| 数据存储 | Supabase 云端 Postgres（guest 模式本地优先，但设计目标是迁移上云） | **单文件 SQLite，自托管，隐私模型优秀** |
| Docker | 有 Dockerfile（需 Supabase 环境） | `docker compose pull && up -d` 预构建镜像，体验最好 |
| 已有功能 | 训练计划、饮食记录、体重趋势、PDF 导出、AI 计划（DeepSeek/OpenAI/vLLM） | 800+ 动作库、训练计划、Gym 模式、营养、体重趋势图 |
| 防反弹安全区间/预警线 | ✘ 无 | ✘ 无 |
| 周/月周期复盘 | ✘ 无 | ✘ 无 |
| 100% 本地零网络 | ✘ 违反（Supabase 云依赖；AI 功能走网络，除非自建 vLLM） | ✔ 满足 |
| 改造成本评估 | **高**：需剥离 Supabase 换成本地存储、移除/本地化 AI 层、新增区间预警与复盘引擎，约等于重写数据层与一半 UI | **中**：SQLite 模型好但后端是 Go，新增「区间预警 + 复盘规则引擎」需改 Go 后端 + React 前端两侧，且要维护其构建链 |

**结论：两个项目都是优秀的「追踪器」，但都不具备防反弹安全区间、预警线与周期复盘能力。** liftcut-tracker 的 Supabase 云依赖直接违反「零网络」硬性要求；lyftr 隐私模型达标但双端改造（Go + React）成本高于自建轻量前端。减重工作台的核心差异化逻辑（预警判定、复盘规则、计划生成）全部集中在前端，因此**自建单页应用是总成本最低的路线**——本仓库即成果。

> 若你未来想要「多端同步 + SQLite 服务端」的完整方案，建议直接使用 lyftr 作为追踪底座，本项目可作为其防反弹模块的设计蓝本。

---

## 二、功能模块

1. **个性化计划生成**：Mifflin-St Jeor 公式估算 BMR → 活动系数得 TDEE → 15% 温和缺口（钳制 300–550 kcal）；蛋白质按目标体重 1.6–2.0 g/kg（随饮食偏好调整）；按器械条件（无器械/哑铃/健身房）生成 7 天训练循环；按饮食偏好（均衡/低碳/高蛋白）生成执行要点。
2. **防反弹监控**：安全体重区间 + 反弹预警线，判定依据为 **7 日体重均线**（过滤水分波动）；走势图含区间色带、预警虚线、越线红点，顶部横幅三级预警（正常/缓冲/警报）。建档时按「目标体重 ±2 kg、预警线 +1 kg」自动初始化。
3. **每日打卡**：体重、热量、三大营养素、饮水、睡眠、训练完成度与时长、压力自评（1–5）、备注；支持任意日期补记与修改。
4. **周期复盘**：近 7 天 / 近 30 天双视图，八项指标评分（打卡率、体重变化、热量、蛋白质、睡眠、压力、运动、饮水），输出「保持/关注/干预」三级建议，内置**防暴食心理干预、压力管理、睡眠修复**话术库。
5. **备份迁移**：一键导出完整 JSON；导入时做 schema 校验与版本迁移，支持跨设备无损恢复。

## 三、目录结构

```
fatloss-guardian/
├─ index.html
├─ package.json
├─ vite.config.js / tailwind.config.js / postcss.config.js
├─ Dockerfile / docker-compose.yml / nginx.conf
└─ src/
   ├─ main.jsx / App.jsx         # 应用骨架、Tab 路由、状态持久化 + 启动自动恢复
   ├─ index.css                  # Tailwind + 组件类
   ├─ lib/
   │  ├─ storage.js              # localStorage 数据层 + JSON 导出/导入校验
   │  ├─ autobackup.js           # 本机文件自动备份（/api/backup，防抖写入）
   │  ├─ plan.js                 # 热量/营养素/训练/饮食计划生成引擎
   │  ├─ review.js               # 周/月复盘规则引擎 + 防反弹状态判定
   │  └─ date.js                 # 日期工具
   └─ components/
      ├─ Onboarding.jsx          # 首次建档引导
      ├─ Dashboard.jsx           # 仪表盘（预警横幅 + 走势图 + 今日进度）
      ├─ WeightChart.jsx         # 纯 SVG 防反弹预警图表
      ├─ CheckInForm.jsx         # 每日打卡（含当日课程清单联动）
      ├─ PlanView.jsx            # 计划展示
      ├─ CourseLibrary.jsx       # 运动课程库（Keep/薄荷课程录入与星期安排）
      ├─ ReviewView.jsx          # 周期复盘
      ├─ SettingsView.jsx        # 区间设置 + 备份/恢复 + 清空
      └─ StatCard.jsx
启动.bat / 停止.bat / start.sh    # 一键启动/停止 Docker 平台
data/backup.json                  # 本机自动备份（gitignore，运行时生成）
```

> `data/` 目录为本机自动备份数据（个人健康数据），已在 .gitignore 中排除，请勿提交。

## 四、一键启动

### 方式 A：本地开发

```bash
npm install
npm run dev
# 打开 http://localhost:5173
```

### 方式 B：生产构建预览

```bash
npm run build
npm run preview
```

### 方式 C：Docker 单容器

```bash
docker compose up -d --build
# 打开 http://localhost:8080
```

### 方式 D：双击一键启动（推荐 Windows 日常使用）

双击 `启动.bat` —— 自动拉起 Docker Desktop（如未运行）、构建启动容器、打开浏览器；双击 `停止.bat` 关闭。macOS / Linux 用 `./start.sh`。

> **数据不再与端口/域名绑定**：dev/preview 模式下数据变化自动写入 `data/backup.json`；docker 模式只读挂载同一文件。任何启动方式打开时若浏览器无数据，会自动从该文件恢复。浏览器数据与文件备份双保险，跨设备迁移仍可用「设置 → 导出 JSON」。

## 五、隐私说明

- 运行时**没有任何网络请求**：无统计、无遥测、无 CDN、无外部字体（可自行抓包验证）。
- 数据仅存于本机浏览器；清除浏览器数据前请先导出备份。
- 本工具为自我管理经验工具，**不构成医疗或营养建议**；热量缺口、断食、疾病人群减重请咨询专业医师或注册营养师。
