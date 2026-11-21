<script setup>
import { TIPOS } from '../utils/format'
import CostoPrimerAnio from './CostoPrimerAnio.vue'
import StatusBadge from './StatusBadge.vue'

defineProps({
  plan: { type: Object, required: true },
  letra: { type: String, required: true },
  titulo: { type: String, required: true },
  tono: { type: String, default: 'bg-brand text-white' },
})
</script>

<template>
  <article class="card flex flex-col gap-3" :class="letra === 'A' ? '!border-brand' : ''">
    <header class="flex items-start gap-3">
      <span class="grid size-11 shrink-0 place-items-center rounded-2xl font-display text-xl font-semibold" :class="tono" aria-hidden="true">{{ letra }}</span>
      <div>
        <p class="text-sm font-bold text-ink-soft">Plan {{ letra }} · {{ titulo }}</p>
        <h3 class="text-lg">{{ plan.carrera }}</h3>
        <p class="text-sm text-ink-soft">{{ plan.universidad }} · {{ TIPOS[plan.tipo] }} · {{ plan.ciudad }}</p>
      </div>
    </header>

    <p>{{ plan.motivo }}</p>

    <div class="flex flex-wrap gap-2">
      <StatusBadge :estado="plan.estado_convocatoria" />
      <span v-if="plan.requiere_mudarse" class="inline-flex items-center rounded-full bg-warn-bg px-3 py-1 text-sm font-bold text-warn-fg">◆ Tendrías que mudarte</span>
      <span v-else class="inline-flex items-center rounded-full bg-ok-bg px-3 py-1 text-sm font-bold text-ok-fg">✔ Sin mudarte</span>
      <span class="inline-flex items-center rounded-full bg-off-bg px-3 py-1 text-sm font-bold text-off-fg">{{ plan.duracion_anios }} años</span>
    </div>

    <CostoPrimerAnio :costo="plan.costo" />

    <details v-if="plan.razones?.length" class="rounded-xl border-2 border-line px-3 py-2">
      <summary class="cursor-pointer font-bold text-brand">¿Por qué esta carrera?</summary>
      <p class="mt-2 text-sm text-ink-soft">Estas respuestas tuyas apuntaron hacia esta área:</p>
      <ul class="mt-1 list-disc space-y-0.5 pl-5">
        <li v-for="r in plan.razones" :key="r">{{ r }}</li>
      </ul>
    </details>

    <RouterLink :to="`/convocatorias/${plan.facultad_id}`" class="btn-ghost mt-auto">Ver convocatoria</RouterLink>
  </article>
</template>
