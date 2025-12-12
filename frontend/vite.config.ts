import { defineConfig, type ViteDevServer, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { IncomingMessage, ServerResponse } from 'http'

// Dynamic import config-loader
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.resolve(__dirname, '../config.yaml')

/** Configuration structure matching config.yaml */
interface AppConfig {
  server?: { host?: string };
  backend?: { port?: number };
  frontend?: { port?: number };
}

// Load config at build time
let buildConfig: AppConfig = {}
try {
  const configContent = fs.readFileSync(configPath, 'utf-8')
  const yaml = await import('js-yaml')
  buildConfig = yaml.load(configContent) as AppConfig
} catch {
  console.warn('[VITE] Could not load config.yaml, using defaults')
}

const serverHost = buildConfig.server?.host || '0.0.0.0'
const serverPort = buildConfig.frontend?.port || 5173

console.log('[VITE] Config loaded:', { serverHost, serverPort, backendPort: buildConfig.backend?.port })

// Custom Vite plugin to serve config.yaml from root at runtime
function configYamlPlugin(): Plugin {
  return {
    name: 'serve-config-yaml',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use('/config.yaml', (_req: IncomingMessage, res: ServerResponse) => {
          try {
            const content = fs.readFileSync(configPath, 'utf-8')
            res.setHeader('Content-Type', 'application/yaml; charset=utf-8')
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            res.end(content)
          } catch (error) {
            console.error('[VITE] Error reading config.yaml:', error)
            res.statusCode = 500
            res.end('Error reading config')
          }
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [configYamlPlugin(), react(), tailwindcss()],
  server: {
    host: serverHost,
    port: serverPort,
  },
})
