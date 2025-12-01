import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Generate build info at build time
const buildDate = new Date().toISOString();
const buildVersion = `1.0.${Math.floor(Date.now() / 1000) % 100000}`;

// Get current git branch
let gitBranch = 'unknown';
try {
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch {
  // If git is not available, use environment variable or default
  gitBranch = process.env.GIT_BRANCH || 'unknown';
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_VERSION__: JSON.stringify(buildVersion),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
  },
})
