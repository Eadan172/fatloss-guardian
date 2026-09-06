import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// 本机文件备份中间件：dev/preview 下支持 GET/POST /api/backup，
// 读写项目根目录 data/backup.json，实现跨端口 / 跨浏览器的自动恢复。
// docker 下同端点由 nginx 只读提供。全程纯本机，零外部网络。
function localBackupPlugin() {
  const file = path.resolve(rootDir, 'data', 'backup.json')
  const handler = (req, res) => {
    if (req.method === 'GET') {
      fs.readFile(file, 'utf8', (err, content) => {
        if (err) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(content)
      })
      return
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        try {
          JSON.parse(body) // 仅接受合法 JSON
          fs.mkdirSync(path.dirname(file), { recursive: true })
          fs.writeFileSync(file, body, 'utf8')
          res.statusCode = 204
          res.end()
        } catch {
          res.statusCode = 400
          res.end('invalid json')
        }
      })
      return
    }
    res.statusCode = 405
    res.end()
  }
  return {
    name: 'local-backup',
    configureServer(server) {
      server.middlewares.use('/api/backup', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/backup', handler)
    },
  }
}

export default defineConfig({
  plugins: [react(), localBackupPlugin()],
  server: { host: true, port: 5173 },
  build: { outDir: 'dist' },
})
