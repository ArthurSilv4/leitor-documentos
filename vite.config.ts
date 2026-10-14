import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

import type { ChatRequestBody } from './src/lib/chat-protocol.ts'
import { handleChat } from './server/chat.ts'
import { readConfig } from './server/config.ts'

// Expõe POST /api/chat no servidor do Vite. As chaves ficam só no
// servidor (variáveis sem prefixo VITE_ não vão para o navegador).
function apiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-chat',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }

        const config = readConfig(env)
        if (!config) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'OPENROUTER_API_KEY não definida no .env' }))
          return
        }

        const controller = new AbortController()
        res.on('close', () => controller.abort())

        let body: ChatRequestBody
        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          body = JSON.parse(raw) as ChatRequestBody
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Corpo da requisição inválido' }))
          return
        }

        res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        for await (const event of handleChat(body, config, controller.signal)) {
          if (controller.signal.aborted) break
          res.write(JSON.stringify(event) + '\n')
        }
        res.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // `vite build --mode artifact` gera a versão estática para o claude.ai
    base: mode === 'artifact' ? './' : '/',
    build: mode === 'artifact' ? { outDir: 'dist-artifact' } : undefined,
    plugins: [react(), tailwindcss(), apiPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
