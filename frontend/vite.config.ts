import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (globalThis as any).process?.cwd?.() ?? '', '')
  const target = env.VITE_API_TARGET || 'http://localhost:8080'
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
        '/script.js': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/api/send': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/api/collect': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      }
    }
  }
})
