import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at a domain root on Vercel → base '/'.
// (For GitHub Pages under a repo path, set base to '/<repo>/' instead.)
export default defineConfig({
  base: '/',
  plugins: [react()],
})
