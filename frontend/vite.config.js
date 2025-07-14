import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
   base: "/",
  plugins: [
     VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'GameTrack',
        short_name: 'GameTrack',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#0f172a',
        icons: [
          {
            src: "/icons/football.png",
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/football.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
    react(),
    tailwindcss({
      config: {
        content: ['!**/node_modules/@mapbox/**'],
      },
    }),
  ],
  build: {
    outDir: 'dist',
  }
})
