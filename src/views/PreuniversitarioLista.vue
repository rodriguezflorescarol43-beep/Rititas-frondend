<script setup>
import { computed, ref } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import { ahorro } from '../composables/useAhorro'
import AsyncState from '../components/AsyncState.vue'
import { bs, MODALIDAD_PRE } from '../utils/format'
import { distanciaKm, formatoKm, ubicacionActual } from '../utils/geo'

const props = defineProps({ tipo: { type: String, required: true } })

const { datos: meta } = useAsync(() => api.meta())
const { datos: todos, error, cargando, ejecutar } = useAsync(() => api.preuniversitarios())

const busqueda = ref('')
const modalidad = ref('') // '' | presencial | virtual | cerca
const departamento = ref('')
const ubicacion = ref(null)
const buscandoUbicacion = ref(false)
const errorUbicacion = ref('')

const FILTROS = [
  ['', 'Todos'],
  ['presencial', 'Presencial'],
  ['virtual', 'Virtual'],
  ['cerca', 'Cerca de mí'],
]
const normal = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const claves = (p) => (p.facultades_tipos || '').split(',').filter(Boolean)

const esTodos = computed(() => props.tipo === 'todos')
const nombreTipo = computed(() => (esTodos.value ? 'todas las facultades' : meta.value?.facultades_tipo?.[props.tipo]?.nombre))
const tipoValido = computed(() => esTodos.value || !!meta.value?.facultades_tipo?.[props.tipo])

async function elegirFiltro(valor) {
  errorUbicacion.value = ''
  modalidad.value = valor
  if (valor !== 'cerca' || ubicacion.value) return
  buscandoUbicacion.value = true
  try {
    ubicacion.value = await ubicacionActual() // se queda en el teléfono: no se envía a ningún servidor
  } catch (e) {
    errorUbicacion.value = e.message
    modalidad.value = ''
  } finally {
    buscandoUbicacion.value = false
  }
}

const lista = computed(() => {
  let filas = (todos.value ?? [])
    .filter((p) => esTodos.value || claves(p).includes(props.tipo))
    .filter((p) => !departamento.value || p.departamento === departamento.value)
    .filter((p) => normal(p.nombre).includes(normal(busqueda.value)))
  if (modalidad.value === 'presencial') filas = filas.filter((p) => p.modalidad !== 'virtual')
  if (modalidad.value === 'virtual') filas = filas.filter((p) => p.modalidad !== 'presencial')
  filas = filas.map((p) => ({
    ...p,
    km: ubicacion.value && p.latitud != null && p.longitud != null
      ? distanciaKm(ubicacion.value, { lat: p.latitud, lng: p.longitud })
      : null,
  }))
  if (modalidad.value === 'cerca') filas.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
  return filas
})
</script>

<template>
  <nav aria-label="Ruta" class="mb-4 flex flex-wrap items-center gap-2 text-sm">
    <RouterLink to="/preuniversitario" class="inline-flex min-h-11 items-center gap-1 font-bold text-brand underline">
      <i class="ti ti-arrow-left" aria-hidden="true"></i> Cambiar facultad
    </RouterLink>
    <span v-if="nombreTipo" class="text-ink-soft">/ {{ nombreTipo }}</span>
  </nav>

  <AsyncState :cargando="cargando" :error="error" @reintentar="ejecutar">
    <p v-if="meta && !tipoValido" class="card text-center">
      No conocemos esa facultad.
      <RouterLink to="/preuniversitario" class="font-bold text-brand underline">Elegir otra</RouterLink>
    </p>
    <template v-else>
      <header class="aparece mb-4">
        <h1 class="text-2xl sm:text-3xl">Preuniversitarios para {{ nombreTipo }}</h1>
        <p class="mt-1 text-ink-soft" role="status">{{ lista.length }} {{ lista.length === 1 ? 'resultado' : 'resultados' }}</p>
      </header>

      <label class="relative mb-3 block">
        <span class="sr-only">Buscar por nombre</span>
        <i class="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-soft" aria-hidden="true"></i>
        <input v-model="busqueda" type="search" class="field !pl-10" placeholder="Buscar por nombre" />
      </label>

      <div class="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar">
        <button
          v-for="[valor, texto] in FILTROS"
          :key="valor"
          type="button"
          class="chip"
          :aria-pressed="modalidad === valor"
          @click="elegirFiltro(valor)"
        >
          <i v-if="valor === 'cerca'" class="ti ti-current-location mr-1" aria-hidden="true"></i>
          {{ valor === 'cerca' && buscandoUbicacion ? 'Buscando…' : texto }}
        </button>
      </div>
      <p v-if="errorUbicacion" role="alert" class="mb-3 font-bold text-bad-fg">{{ errorUbicacion }}</p>
      <p v-if="modalidad === 'cerca' && ubicacion" class="mb-3 text-sm text-ink-soft">
        <i class="ti ti-lock" aria-hidden="true"></i> Tu ubicación se usa solo en tu teléfono. No se envía a nadie.
      </p>

      <label class="mb-5 block max-w-xs">
        <span class="mb-1 block text-sm font-bold text-ink-soft">Departamento</span>
        <select v-model="departamento" class="field">
          <option value="">Todos</option>
          <option v-for="d in meta?.departamentos ?? []" :key="d" :value="d">{{ d }}</option>
        </select>
      </label>

      <ul class="space-y-3">
        <li v-for="(p, i) in lista" :key="p.id" class="aparece" :style="{ '--i': i }">
          <RouterLink :to="`/preuniversitario/${p.id}`" class="card sube flex items-center gap-3 hover:border-brand sm:gap-4">
            <img
              v-if="p.imagen_url && !ahorro"
              :src="p.imagen_url"
              :alt="`Foto de ${p.nombre}`"
              class="h-20 w-24 shrink-0 rounded-xl object-cover sm:h-24 sm:w-32"
              loading="lazy"
            />
            <span v-else class="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-off-bg text-3xl text-ink-soft sm:h-24 sm:w-32" aria-hidden="true">
              <i class="ti ti-photo"></i>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-lg font-bold leading-tight">{{ p.nombre }}</span>
              <span class="mt-0.5 block text-sm text-ink-soft">
                <i class="ti ti-map-pin" aria-hidden="true"></i>
                {{ p.zona ? `${p.zona}, ` : '' }}{{ p.ciudad }}
                <strong v-if="p.km != null" class="text-brand"> · a {{ formatoKm(p.km) }}</strong>
              </span>
              <span class="mt-1.5 flex flex-wrap gap-1.5 text-sm font-bold">
                <span class="rounded-full bg-brand-soft px-3 py-0.5 text-brand">{{ p.modalidad === 'mixta' ? 'Presencial y virtual' : MODALIDAD_PRE[p.modalidad] }}</span>
                <span v-if="claves(p).length" class="rounded-full bg-off-bg px-3 py-0.5 text-off-fg">{{ claves(p).length }} {{ claves(p).length === 1 ? 'facultad' : 'facultades' }}</span>
                <span class="rounded-full bg-off-bg px-3 py-0.5 text-off-fg">{{ bs(p.costo_bs) }}</span>
              </span>
            </span>
            <i class="ti ti-chevron-right text-xl text-ink-soft" aria-hidden="true"></i>
          </RouterLink>
        </li>
      </ul>

      <p v-if="!lista.length" class="card text-center text-ink-soft">
        No hay resultados con estos filtros.
        <span v-if="modalidad === 'cerca'"> Algunos preuniversitarios aún no tienen ubicación cargada.</span>
      </p>

      <RouterLink
        :to="{ path: '/contacto', query: { asunto: 'preuniversitario' } }"
        class="mt-5 block rounded-2xl border-2 border-dashed border-line-strong p-4 text-center text-ink-soft hover:border-brand hover:text-brand"
      >
        ¿No encuentras el tuyo? <strong>Escríbenos para que lo agreguemos.</strong>
      </RouterLink>
    </template>
  </AsyncState>
</template>
