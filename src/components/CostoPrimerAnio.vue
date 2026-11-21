<script setup>
import { bs } from '../utils/format'

defineProps({ costo: { type: Object, required: true } })
</script>

<template>
  <div class="rounded-xl bg-brand-soft p-3">
    <p class="text-sm font-bold text-ink-soft">Costo estimado del primer año</p>
    <dl class="mt-1 space-y-0.5 text-sm">
      <div v-for="l in costo.lineas" :key="l.clave" class="flex justify-between gap-3">
        <dt class="text-ink-soft">{{ l.etiqueta }}</dt>
        <dd class="font-bold">{{ l.monto == null ? 'Por confirmar' : bs(l.monto) }}</dd>
      </div>
    </dl>
    <p class="mt-2 flex items-baseline justify-between gap-3 border-t-2 border-line pt-2">
      <span class="font-bold">Total estimado</span>
      <span class="text-xl font-bold text-brand">{{ bs(costo.total) }}</span>
    </p>
    <p v-if="costo.incompleto" class="mt-1 text-sm font-bold text-warn-fg">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i> Falta información: el total real será mayor.
    </p>
    <p class="mt-1 text-xs text-ink-soft">Es una estimación con los costos publicados. Confírmala con la universidad.</p>
  </div>
</template>
