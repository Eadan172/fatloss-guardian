// 日期工具：统一使用本地时区的 YYYY-MM-DD
export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return todayStr(d)
}

export function lastNDays(n, end = todayStr()) {
  const arr = []
  for (let i = n - 1; i >= 0; i--) arr.push(addDays(end, -i))
  return arr
}

export function fmtCN(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function weekdayCN(dateStr) {
  return ['日', '一', '二', '三', '四', '五', '六'][new Date(dateStr + 'T00:00:00').getDay()]
}
