import React from 'react'
import { fmtCN } from '../lib/date'

// 纯 SVG 体重走势图：安全区间色带 + 反弹预警线 + 7 日均线 + 每日数据点
// points: [{ date, weight, avg }] 按日期升序
export default function WeightChart({ points, low, high, rebound }) {
  const W = 760
  const H = 280
  const P = { l: 48, r: 16, t: 16, b: 30 }

  if (!points.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
        暂无体重数据 — 完成今日打卡后，走势图将在这里生成
      </div>
    )
  }

  const ys = points.map((p) => p.weight)
  for (const v of [low, high, rebound]) if (v > 0) ys.push(v)
  let yMin = Math.min(...ys)
  let yMax = Math.max(...ys)
  const pad = Math.max(0.6, (yMax - yMin) * 0.15)
  yMin -= pad
  yMax += pad

  const iw = W - P.l - P.r
  const ih = H - P.t - P.b
  const x = (i) => (points.length === 1 ? P.l + iw / 2 : P.l + (i * iw) / (points.length - 1))
  const y = (w) => P.t + ((yMax - w) * ih) / (yMax - yMin)

  const pathFor = (key) =>
    points
      .map((p, i) => (p[key] == null ? null : `${i === 0 || points[i - 1][key] == null ? 'M' : 'L'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`))
      .filter(Boolean)
      .join(' ')

  // Y 轴刻度（5 格）
  const ticks = []
  for (let i = 0; i <= 4; i++) {
    const v = yMax - (i * (yMax - yMin)) / 4
    ticks.push({ v, y: y(v) })
  }
  // X 轴标签（最多 7 个）
  const labelEvery = Math.max(1, Math.ceil(points.length / 7))

  const bandTop = high > 0 ? y(high) : null
  const bandBottom = low > 0 ? y(Math.max(low, yMin)) : null

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px] w-full" role="img" aria-label="体重走势图">
        <defs>
          <linearGradient id="zoneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* 网格与 Y 轴刻度 */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={t.y} y2={t.y} stroke="#e2e8f0" strokeDasharray={i === 4 ? '' : '3 4'} />
            <text x={P.l - 8} y={t.y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {t.v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* 安全区间色带 */}
        {bandTop != null && bandBottom != null && bandBottom > bandTop && (
          <rect x={P.l} y={bandTop} width={iw} height={bandBottom - bandTop} fill="url(#zoneGrad)" rx="4" />
        )}
        {high > 0 && (
          <g>
            <line x1={P.l} x2={W - P.r} y1={y(high)} y2={y(high)} stroke="#10b981" strokeWidth="1.4" strokeDasharray="6 4" />
            <text x={W - P.r} y={y(high) - 5} textAnchor="end" fontSize="11" fontWeight="700" fill="#059669">
              区间上限 {high} kg
            </text>
          </g>
        )}
        {low > 0 && (
          <g>
            <line x1={P.l} x2={W - P.r} y1={y(low)} y2={y(low)} stroke="#10b981" strokeWidth="1.4" strokeDasharray="6 4" />
            <text x={W - P.r} y={y(low) + 13} textAnchor="end" fontSize="11" fontWeight="700" fill="#059669">
              区间下限 {low} kg
            </text>
          </g>
        )}

        {/* 反弹预警线 */}
        {rebound > 0 && (
          <g>
            <line x1={P.l} x2={W - P.r} y1={y(rebound)} y2={y(rebound)} stroke="#e11d48" strokeWidth="1.8" strokeDasharray="2 4" />
            <text x={P.l + 4} y={y(rebound) - 5} fontSize="11" fontWeight="800" fill="#e11d48">
              ⚠ 反弹预警线 {rebound} kg
            </text>
          </g>
        )}

        {/* 每日体重线 + 7 日均线 */}
        <path d={pathFor('weight')} fill="none" stroke="#94a3b8" strokeWidth="1.4" />
        <path d={pathFor('avg')} fill="none" stroke="#4f46e5" strokeWidth="2.6" strokeLinecap="round" />

        {/* 数据点：越过反弹线标红 */}
        {points.map((p, i) => {
          const danger = rebound > 0 && (p.avg ?? p.weight) >= rebound
          return (
            <g key={p.date}>
              <circle cx={x(i)} cy={y(p.weight)} r={danger ? 5 : 3.4} fill={danger ? '#e11d48' : '#fff'} stroke={danger ? '#e11d48' : '#64748b'} strokeWidth="1.6" />
              {i % labelEvery === 0 && (
                <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#94a3b8">
                  {fmtCN(p.date)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-5 bg-indigo-600" /> 7 日均线</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-5 bg-slate-400" /> 每日体重</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-5 rounded-sm bg-emerald-500/15 ring-1 ring-emerald-500/40" /> 安全区间</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-5 bg-rose-600" /> 反弹预警线</span>
      </div>
    </div>
  )
}
