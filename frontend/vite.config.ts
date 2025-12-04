import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, type ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default ({ mode }: ConfigEnv) => {
  const repoRoot = path.resolve(__dirname, '..'); // frontend/.. = repo root
  const env = loadEnv(mode, repoRoot, '');

  const viteHost = env.VITE_HOST ?? '0.0.0.0';
  const vitePort = Number(env.VITE_PORT || 5173);

  return defineConfig({
    root: path.resolve(__dirname),
    envDir: repoRoot,
    plugins: [react(), tailwindcss()],
    server: {
      host: viteHost === 'true' ? true : viteHost,
      port: vitePort
    },
    preview: {
      host: viteHost === 'true' ? '0.0.0.0' : viteHost,
      port: vitePort
    }
  })
}
