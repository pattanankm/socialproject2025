import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
<<<<<<< HEAD
  server: {
    port: 5137,
    strictPort: true,
  },
=======
>>>>>>> prem
})
