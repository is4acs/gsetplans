import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Cette section aide Vite à trouver les bons fichiers sources pour Recharts
    mainFields: ['module', 'main', 'jsnext:main', 'jsnext'],
  },
  build: {
    commonjsOptions: {
      // Permet de transformer les modules mixtes (CommonJS/ESM) utilisés par certaines librairies
      transformMixedEsModules: true, 
    },
  },
  // Optimisation pour forcer l'inclusion de ces dépendances
  optimizeDeps: {
    include: ['recharts', 'lodash', 'react-smooth', 'recharts-scale'],
  },
})