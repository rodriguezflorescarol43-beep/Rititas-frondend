<script setup>
defineProps({
  titulo: { type: String, required: true },
  nota: { type: String, default: '' },
  subtitulo: { type: String, default: '' },
})
</script>

<template>
  <header class="aparece mb-6 pt-2">
    <span class="mb-3 block h-1.5 w-12 rounded-full bg-mint" aria-hidden="true"></span>
    <h1 class="text-2xl sm:text-4xl">
      {{ titulo }}
      <small v-if="nota" class="block text-base font-normal text-ink-soft sm:inline sm:text-lg">{{ nota }}</small>
    </h1>
    <p v-if="subtitulo" class="mt-2 max-w-2xl text-lg text-ink-soft">{{ subtitulo }}</p>
  </header>
</template>
