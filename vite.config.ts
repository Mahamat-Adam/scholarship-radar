import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Published as a project site, so every asset URL has to carry the repository
// name. Vite bakes this into the build; `npm run dev` ignores it.
// three is the only genuinely large dependency and only one component needs it,
// so it is kept out of the initial download — but by the lazy import in App.tsx
// rather than by a manualChunks rule here. The dynamic import already earns the
// component its own chunk, and the bundler splits it without being told to.
export default defineConfig({
  base: '/scholarship-radar/',
  plugins: [react()],
})
