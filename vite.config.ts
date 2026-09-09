import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// Internal-only admin tool — no PWA manifest needed, unlike the tenant app.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Fixed, not auto-picked — NODE's dev CORS_ORIGIN allowlist names this
  // port explicitly (see NODE/.env.example).
  server: { port: 5175, strictPort: true },
})
