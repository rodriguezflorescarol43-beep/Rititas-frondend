<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// «Escuchar»: lee la pantalla en voz alta con la voz del propio teléfono. No usa internet ni gasta datos.
const route = useRoute()
const soportado = typeof window !== 'undefined' && 'speechSynthesis' in window
const estado = ref('reposo') // reposo | leyendo | pausa
const sinVoz = ref(false)
let cola = []

// Los motores de voz se cortan con textos largos: se lee por frases cortas.
function trozos(texto) {
  const frases = texto.replace(/\s+/g, ' ').match(/[^.!?:;]+[.!?:;]?/g) ?? []
  const salida = []
  for (const f of frases) {
    let resto = f.trim()
    while (resto.length > 180) {
      const corte = resto.lastIndexOf(' ', 180)
      salida.push(resto.slice(0, corte > 0 ? corte : 180))
      resto = resto.slice(corte > 0 ? corte : 180).trim()
    }
    if (resto) salida.push(resto)
  }
  return salida
}

function elegirVoz() {
  const voces = window.speechSynthesis.getVoices()
  const orden = ['es-BO', 'es-US', 'es-MX', 'es-419', 'es-ES']
  for (const idioma of orden) {
    const v = voces.find((x) => x.lang?.replace('_', '-').toLowerCase() === idioma.toLowerCase())
    if (v) return v
  }
  return voces.find((x) => x.lang?.toLowerCase().startsWith('es')) ?? null
}

function hablarSiguiente() {
  const siguiente = cola.shift()
  if (!siguiente) {
    estado.value = 'reposo'
    return
  }
  const u = new SpeechSynthesisUtterance(siguiente)
  const voz = elegirVoz()
  if (voz) u.voice = voz
  u.lang = voz?.lang ?? 'es-ES'
  u.rate = 0.95
  u.onend = hablarSiguiente
  u.onerror = () => (estado.value = 'reposo')
  window.speechSynthesis.speak(u)
}

function leer() {
  sinVoz.value = false
  window.speechSynthesis.cancel()
  const contenido = document.querySelector('#contenido')?.innerText ?? ''
  cola = trozos(contenido)
  if (!cola.length) return
  if (!elegirVoz() && window.speechSynthesis.getVoices().length) {
    sinVoz.value = true // hay voces, pero ninguna en español
    return
  }
  estado.value = 'leyendo'
  hablarSiguiente()
}

function pausar() {
  window.speechSynthesis.pause()
  estado.value = 'pausa'
}
function seguir() {
  window.speechSynthesis.resume()
  estado.value = 'leyendo'
}
function detener() {
  cola = []
  window.speechSynthesis.cancel()
  estado.value = 'reposo'
}

watch(() => route.fullPath, detener)
onBeforeUnmount(() => soportado && detener())
</script>

<template>
  <div v-if="soportado" class="no-print mb-3 flex flex-wrap items-center justify-end gap-2" role="region" aria-label="Escuchar esta página">
    <button v-if="estado === 'reposo'" type="button" class="btn-ghost !min-h-10 !px-4 !py-1.5 text-sm" @click="leer">
      <i class="ti ti-volume" aria-hidden="true"></i> Escuchar esta página
    </button>
    <template v-else>
      <button v-if="estado === 'leyendo'" type="button" class="btn-ghost !min-h-10 !px-4 !py-1.5 text-sm" @click="pausar">
        <i class="ti ti-player-pause" aria-hidden="true"></i> Pausar
      </button>
      <button v-else type="button" class="btn-ghost !min-h-10 !px-4 !py-1.5 text-sm" @click="seguir">
        <i class="ti ti-player-play" aria-hidden="true"></i> Seguir
      </button>
      <button type="button" class="btn-ghost !min-h-10 !px-4 !py-1.5 text-sm" @click="detener">
        <i class="ti ti-player-stop" aria-hidden="true"></i> Detener
      </button>
    </template>
    <p v-if="sinVoz" role="alert" class="w-full text-right text-sm font-bold text-warn-fg">
      Tu teléfono no tiene una voz en español instalada. Puedes agregarla en los ajustes de voz del teléfono.
    </p>
  </div>
</template>
