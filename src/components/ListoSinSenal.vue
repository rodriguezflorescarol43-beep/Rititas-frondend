<script setup>
// Aviso de preparación: dice cuándo la página ya se guardó completa en el teléfono.
// Mientras se guarda, pide no apagar los datos; al terminar avisa unos segundos y se va.
import { onMounted, ref, watch } from 'vue'
import { estadoPaquete } from '../datos/paquete'

const appLista = ref(!import.meta.env.PROD || !('serviceWorker' in navigator)) // sin service worker no hay nada que esperar
const mostrarListo = ref(false)
let huboEspera = false

onMounted(() => {
  if (appLista.value) return
  navigator.serviceWorker.ready.then(() => {
    appLista.value = true
  })
})

const preparando = () => !appLista.value || !estadoPaquete.version

watch(
  [appLista, () => estadoPaquete.version],
  () => {
    if (preparando()) {
      huboEspera = true
    } else if (huboEspera) {
      mostrarListo.value = true
      setTimeout(() => (mostrarListo.value = false), 8000)
      huboEspera = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="preparando()" role="status" class="mx-auto mt-2 max-w-5xl px-4">
    <p class="rounded-xl border border-line bg-warn-bg px-3 py-2 text-sm font-bold text-warn-fg">
      <i class="ti ti-refresh animate-spin" aria-hidden="true"></i>
      Preparando para usar sin señal… no apagues tus datos todavía.
    </p>
  </div>
  <div v-else-if="mostrarListo" role="status" class="mx-auto mt-2 max-w-5xl px-4">
    <p class="rounded-xl bg-ok-bg px-3 py-2 text-sm font-bold text-ok-fg">
      <i class="ti ti-circle-check" aria-hidden="true"></i>
      Listo: ya puedes usar la página sin señal.
    </p>
  </div>
</template>
