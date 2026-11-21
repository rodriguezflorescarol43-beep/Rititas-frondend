<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { MENU_ADMIN } from '../../admin/recursos'
import { hayAdmin, salir } from '../../composables/useAdmin'
import { NOMBRE } from '../../config'

const router = useRouter()

// Si el servidor rechaza el token o vence la sesión, se vuelve a pedir la contraseña.
watch(hayAdmin, (activo) => {
  if (!activo) router.push('/admin/login')
})

function cerrarSesion() {
  salir()
}
</script>

<template>
  <div class="min-h-screen md:flex">
    <aside class="border-b-2 border-line bg-card md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r-2">
      <div class="flex items-center justify-between gap-2 px-4 py-3 md:block">
        <p class="font-display text-lg font-semibold text-brand">
          <i class="ti ti-settings" aria-hidden="true"></i> Administración
        </p>
        <p class="hidden text-sm text-ink-soft md:block">{{ NOMBRE }}</p>
        <button type="button" class="btn-ghost !min-h-10 !px-3 !py-1 text-sm md:hidden" @click="cerrarSesion">Salir</button>
      </div>
      <nav aria-label="Administración" class="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-4">
        <RouterLink
          v-for="item in MENU_ADMIN"
          :key="item.to"
          :to="item.to"
          class="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold text-ink-soft hover:bg-brand-soft"
          active-class="bg-brand-soft !text-brand"
          :exact-active-class="item.exacto ? 'bg-brand-soft !text-brand' : ''"
        >
          <i class="ti text-xl" :class="item.icono" aria-hidden="true"></i>
          {{ item.etiqueta }}
        </RouterLink>
      </nav>
      <div class="hidden space-y-2 border-t-2 border-line p-4 md:block">
        <RouterLink to="/" target="_blank" class="btn-ghost w-full !py-2 text-sm">
          <i class="ti ti-external-link" aria-hidden="true"></i> Ver la página
        </RouterLink>
        <button type="button" class="btn-ghost w-full !py-2 text-sm" @click="cerrarSesion">
          <i class="ti ti-logout" aria-hidden="true"></i> Cerrar sesión
        </button>
      </div>
    </aside>
    <main id="contenido" class="min-w-0 flex-1 px-4 py-6 md:px-8">
      <RouterView />
    </main>
  </div>
</template>
