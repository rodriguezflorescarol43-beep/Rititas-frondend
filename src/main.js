import { createApp } from 'vue'
// Solo las letras latinas (suficientes para español): antes se bajaban también cirílico, griego y vietnamita.
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import '@fontsource/lexend/latin-500.css'
import '@fontsource/lexend/latin-600.css'
// Iconos: una fuente recortada solo a los que usamos (genérala con `npm run iconos`).
import './iconos.css'
import './style.css'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { iniciarPaquete } from './datos/paquete'
import router from './router'
import { iniciarCola } from './utils/cola'

registerSW({ immediate: true })

createApp(App).use(router).mount('#app')

iniciarPaquete() // baja (o actualiza) el paquete de datos en segundo plano
iniciarCola() // reenvía los mensajes que quedaron esperando señal
