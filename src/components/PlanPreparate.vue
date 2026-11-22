<script setup>
import { bs, diasTexto, fecha, MODALIDAD_PRE } from '../utils/format'
import CostoPrimerAnio from './CostoPrimerAnio.vue'

defineProps({ plan: { type: Object, required: true } })
</script>

<template>
  <article class="card flex flex-col gap-3">
    <header class="flex items-start gap-3">
      <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-night font-display text-xl font-semibold text-mint" aria-hidden="true">C</span>
      <div>
        <p class="text-sm font-bold text-ink-soft">Plan C · Prepárate y vuelve a intentar</p>
        <h3 class="text-lg">{{ plan.preuniversitario?.nombre ?? 'Preuniversitario por confirmar' }}</h3>
      </div>
    </header>

    <p>{{ plan.motivo }}</p>

    <div v-if="plan.preuniversitario" class="grid grid-cols-3 gap-2 text-sm">
      <div><p class="text-ink-soft">Dura</p><p class="font-bold">{{ plan.preuniversitario.duracion_meses ? `${plan.preuniversitario.duracion_meses} meses` : 'Por confirmar' }}</p></div>
      <div><p class="text-ink-soft">Costo</p><p class="font-bold">{{ bs(plan.preuniversitario.costo_bs) }}</p></div>
      <div><p class="text-ink-soft">Modalidad</p><p class="font-bold">{{ MODALIDAD_PRE[plan.preuniversitario.modalidad] }}</p></div>
    </div>

    <div class="rounded-xl border-2 border-line p-3 text-sm">
      <p class="font-bold">Próxima oportunidad de ingreso</p>
      <p v-if="plan.proxima">
        Inscripción del {{ fecha(plan.proxima.inscripcion_inicio) }} al {{ fecha(plan.proxima.inscripcion_fin) }}.
        <span class="font-bold text-brand">{{ diasTexto(plan.proxima.estado, plan.proxima.dias_restantes) }}</span>
      </p>
      <p v-else class="text-ink-soft">Todavía no hay una fecha nueva publicada. Pregunta en la universidad cuándo abre la próxima convocatoria.</p>
    </div>

    <CostoPrimerAnio :costo="plan.costo" />

    <RouterLink v-if="plan.preuniversitario" :to="`/preuniversitario/${plan.preuniversitario.id}`" class="btn-ghost mt-auto">Ver este preuniversitario</RouterLink>
  </article>
</template>
