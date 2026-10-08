import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' -> el build funciona dentro de cualquier carpeta de htdocs.
// outDir '../app' -> el build queda en tutorias-umg/app, junto a la API.
// En desarrollo (npm run dev) /api se redirige a XAMPP para evitar CORS.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../app', emptyOutDir: true },
  server: {
    proxy: { '/api': 'http://localhost/tutorias-umg' },
  },
})
