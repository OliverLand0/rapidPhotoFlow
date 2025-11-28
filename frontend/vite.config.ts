import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generate build info at build time
const buildDate = new Date().toISOString();
const buildVersion = `1.0.${Math.floor(Date.now() / 1000) % 100000}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
})
