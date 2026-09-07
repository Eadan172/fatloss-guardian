import React from 'react'
import { parseMove } from '../lib/exerciseDB'

// 渲染单个训练动作：专业名词自动附带 fitwill.app 动作介绍链接（新标签页打开）
export default function LinkedMove({ move }) {
  return (
    <span>
      {parseMove(move).map((p, i) =>
        p.url ? (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            title={`查看「${p.text}」动作介绍`}
            className="font-semibold text-indigo-600 underline decoration-indigo-300 decoration-dotted underline-offset-2 hover:text-indigo-800"
          >
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  )
}
