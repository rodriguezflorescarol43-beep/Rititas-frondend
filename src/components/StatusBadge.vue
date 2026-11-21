<script setup>
import { computed } from 'vue'

const props = defineProps({ estado: { type: String, default: null } })

// El estado nunca depende solo del color: lleva forma y texto.
const MAPA = {
  abierta: { texto: 'Abierta', forma: '✔', clases: 'bg-ok-bg text-ok-fg' },
  proxima: { texto: 'Próxima', forma: '◆', clases: 'bg-warn-bg text-warn-fg' },
  cerrada: { texto: 'Cerrada', forma: '○', clases: 'bg-off-bg text-off-fg' },
}
const info = computed(
  () => MAPA[props.estado] ?? { texto: 'Sin convocatoria', forma: '○', clases: 'bg-off-bg text-off-fg' },
)
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold" :class="info.clases">
    <span aria-hidden="true">{{ info.forma }}</span>
    {{ info.texto }}
  </span>
</template>
