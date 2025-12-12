import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load config.json from project root
let frontendConfig = {
    backendUrl: 'http://localhost:4200',
    apiPrefix: '/api'
}

try {
    const configPath = join(__dirname, '..', 'config.json')
    const configFile = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configFile)
    if (config.frontend) {
        frontendConfig = config.frontend
    }
} catch (error) {
    console.warn('[vite] Failed to load config.json, using defaults:', error)
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        // Inject config values as compile-time constants
        '__CONFIG_BACKEND_URL__': JSON.stringify(frontendConfig.backendUrl),
        '__CONFIG_API_PREFIX__': JSON.stringify(frontendConfig.apiPrefix),
    }
})
