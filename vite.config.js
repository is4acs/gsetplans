import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // On supprime resolve, build.commonjsOptions et optimizeDeps qui causaient l'erreur
})