<script setup>
import { useOnline } from '../composables/useOnline'

const { enLinea } = useOnline()
</script>

<template>
  <div
    v-if="!enLinea"
    role="status"
    class="no-print bg-warn-bg px-4 py-2 text-center text-sm font-bold text-warn-fg"
  >
    <i class="ti ti-wifi-off" aria-hidden="true"></i>
    Sin conexión: estás viendo lo último que se guardó en tu dispositivo.
  </div>
</template>
