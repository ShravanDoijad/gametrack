import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: {
        content: ['!**/node_modules/@mapbox/**'],
      },
    }),
  ],
  build: {
    outDir: 'dist',
  },
 
  server: {
    historyApiFallback: true,
  }
})
