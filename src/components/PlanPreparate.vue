<script setup>
defineProps({ plan: { type: Object, required: true } })
</script>

<template>
  <article class="card flex flex-col gap-3">
    <header class="flex items-start gap-3">
      <span class="grid size-11 shrink-0 place-items-center rounded-2xl bg-night font-display text-xl font-semibold text-mint" aria-hidden="true">C</span>
      <div>
        <p class="text-sm font-bold text-ink-soft">Plan C · Prepárate y vuelve a intentar</p>
        <h3 class="text-lg">{{ plan.facultad_tipo_nombre ? `Preuniversitarios para ${plan.facultad_tipo_nombre}` : 'Preuniversitarios' }}</h3>
      </div>
    </header>

    <p>{{ plan.motivo }}</p>

    <!-- Lleva a los preuniversitarios de lo que le salió en el test (su prioridad). -->
    <RouterLink :to="`/preuniversitario/facultad/${plan.facultad_tipo ?? 'todos'}`" class="btn-ghost mt-auto">Ver todos los preuniversitarios</RouterLink>
  </article>
</template>
