import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Los datos de la API (solo GET) se guardan en el dispositivo: primero se intenta la red
// y, si no hay conexión, se muestra lo último que se vio. La app en sí queda precargada.
// Las respuestas del panel de administración (/api/admin) son privadas: nunca se guardan.
const esDatosDeLaApi = ({ url, request }) =>
  request.method === 'GET' &&
  url.pathname.startsWith('/api/') &&
  !url.pathname.startsWith('/api/admin') &&
  !url.pathname.startsWith('/api/paquete') && // el paquete lo guarda y verifica la propia página
  url.pathname !== '/api/salud'

// Las imágenes subidas se guardan para verlas sin conexión. Los videos no: son pesados.
const esImagenSubida = ({ url, request }) => url.pathname.startsWith('/media/') && request.destination === 'image'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Guía de ingreso',
        short_name: 'Guía de ingreso',
        description:
          'Convocatorias, preuniversitarios (institutos), universidades y orientación para elegir qué estudiar.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F7F8FA',
        theme_color: '#0B1B3A',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Sin .woff: todos los navegadores actuales usan woff2, y el .woff solo ocupaba espacio.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // El panel de administración se usa con conexión: no se guarda de antemano en el teléfono del
        // estudiante. Así la preparación termina antes (menos archivos que bajar con señal débil).
        globIgnores: ['**/Admin*.js', '**/admin-*.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: esDatosDeLaApi,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-datos',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: esImagenSubida,
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagenes-subidas',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8000' },
  },
})
