// 本机文件级自动备份：dev/preview 下经 vite 中间件读写项目根目录 data/backup.json；
// docker 下同端点由 nginx 只读提供（POST 静默失败）。数据不出本机，零外部网络。
import { validateImport } from './storage'

let timer = null

// 启动时尝试从本机备份文件恢复，返回校验后的 state 或 null
export async function restoreFromServerBackup() {
  try {
    const res = await fetch('/api/backup')
    if (!res.ok) return null
    const r = validateImport(await res.text())
    return r.ok ? r.state : null
  } catch {
    return null
  }
}

// 立即写入本机备份文件（用于「清空数据」等不能等防抖的场景）
export function writeServerBackup(state) {
  clearTimeout(timer)
  post(state)
}

// 状态变化后防抖写入本机备份文件（静态部署下 404/405 静默忽略）
export function scheduleServerBackup(state) {
  clearTimeout(timer)
  timer = setTimeout(() => post(state), 800)
}

async function post(state) {
  try {
    await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'fatloss-guardian', exportedAt: new Date().toISOString(), data: state }),
    })
  } catch {
    /* 静默：纯静态部署（如未挂载备份的 docker）下无此端点 */
  }
}
