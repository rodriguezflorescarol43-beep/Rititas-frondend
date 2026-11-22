<script setup>
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'
import EscucharBoton from './components/EscucharBoton.vue'
import EstadoDatos from './components/EstadoDatos.vue'
import ListoSinSenal from './components/ListoSinSenal.vue'
import OfflineBanner from './components/OfflineBanner.vue'

const route = useRoute()
</script>

<template>
  <!-- El panel de administración trae su propio menú y no muestra el de la página pública. -->
  <RouterView v-if="route.meta.sinMenu" />

  <template v-else>
    <a
      href="#contenido"
      class="absolute left-2 top-2 z-30 -translate-y-20 rounded-lg bg-brand px-4 py-2 font-bold text-white focus:translate-y-0"
    >
      Saltar al contenido
    </a>
    <AppHeader />
    <OfflineBanner />
    <ListoSinSenal />
    <div class="mx-auto max-w-5xl px-4 pt-3"><EscucharBoton /></div>
    <main id="contenido" class="mx-auto max-w-5xl px-4 pb-28 pt-3 md:pb-12">
      <RouterView />
    </main>
    <footer class="no-print mx-auto max-w-5xl px-4 pb-28 text-sm text-ink-soft md:pb-10">
      <p>
        <i class="ti ti-shield-check" aria-hidden="true"></i>
        Sin registro. Tus respuestas del test se calculan en tu teléfono. Confirma siempre las fechas y los costos en la fuente oficial.
      </p>
      <EstadoDatos />
    </footer>
    <BottomNav />
  </template>
</template>
