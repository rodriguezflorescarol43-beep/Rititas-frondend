<script setup>
defineProps({
  cargando: Boolean,
  error: { type: Object, default: null },
  vacio: Boolean,
  vacioTexto: { type: String, default: 'No hay resultados con estos filtros.' },
})
defineEmits(['reintentar'])
</script>

<template>
  <div v-if="cargando" role="status" class="card text-center text-ink-soft">
    <i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Cargando…
  </div>
  <div v-else-if="error" role="alert" class="card border-bad-fg bg-bad-bg text-bad-fg">
    <p class="font-bold">
      <i class="ti ti-wifi-off" aria-hidden="true"></i>
      {{ error.sinConexion ? 'No hay conexión' : 'No se pudo cargar' }}
    </p>
    <p>
      {{
        error.sinConexion
          ? 'Esta página todavía no se guardó en tu celular. Conéctate a internet una vez y quedará disponible sin conexión.'
          : error.message
      }}
    </p>
    <button type="button" class="btn-ghost mt-3" @click="$emit('reintentar')">Intentar de nuevo</button>
  </div>
  <div v-else-if="vacio" class="card text-center text-ink-soft">{{ vacioTexto }}</div>
  <slot v-else />
</template>
