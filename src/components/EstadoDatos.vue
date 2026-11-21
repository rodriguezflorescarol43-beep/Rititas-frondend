<script setup>
import { computed } from 'vue'
import { estadoPaquete } from '../datos/paquete'
import { fecha } from '../utils/format'
import { pendientes } from '../utils/cola'

const sello = computed(() => {
  const v = estadoPaquete.version
  if (!v) return 'Todavía sin datos guardados'
  return v.startsWith('1970') ? 'Datos de ejemplo' : `Datos del ${fecha(v.slice(0, 10))}`
})
</script>

<template>
  <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
    <span><i class="ti ti-database" aria-hidden="true"></i> {{ sello }}</span>
    <span v-if="estadoPaquete.actualizando" role="status"><i class="ti ti-refresh animate-spin" aria-hidden="true"></i> Actualizando…</span>
    <span v-if="pendientes" role="status" class="font-bold text-warn-fg">
      <i class="ti ti-clock" aria-hidden="true"></i> {{ pendientes }} {{ pendientes === 1 ? 'mensaje esperando' : 'mensajes esperando' }} señal
    </span>
    <RouterLink to="/sin-senal" class="font-bold text-brand underline">Usar sin señal</RouterLink>
  </p>
</template>
