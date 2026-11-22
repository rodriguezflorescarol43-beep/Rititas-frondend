<script setup>
import { fecha } from '../utils/format'

defineProps({
  verificado: { type: String, default: null },
  fuente: { type: String, default: null },
})
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
    <span v-if="verificado" class="font-bold text-ok-fg">
      <i class="ti ti-circle-check" aria-hidden="true"></i> Verificado el {{ fecha(verificado) }}
    </span>
    <span v-else-if="fuente" class="font-bold text-warn-fg">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i> Tomado de la fuente · falta confirmar
    </span>
    <span v-else class="font-bold text-warn-fg">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i> Dato de ejemplo · sin verificar
    </span>
    <a v-if="fuente" :href="fuente" target="_blank" rel="noopener" class="underline">Ver fuente oficial</a>
  </p>
</template>
