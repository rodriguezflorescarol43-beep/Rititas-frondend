<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import AsyncState from '../components/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { TIPOS } from '../utils/format'

const route = useRoute()
const universidadId = computed(() => route.query.uni || '')
const { datos, error, cargando, ejecutar } = useAsync(() => api.facultades({ universidad_id: universidadId.value }))
watch(universidadId, () => ejecutar())

const estado = ref('')
const tipo = ref('')
const ESTADOS = [
  ['', 'Todas'],
  ['abierta', 'Abiertas'],
  ['proxima', 'Próximas'],
  ['cerrada', 'Cerradas'],
]
const TIPOS_FILTRO = [['', 'Todas las universidades'], ...Object.entries(TIPOS)]

const grupos = computed(() => {
  const mapa = new Map()
  for (const f of datos.value ?? []) {
    if (estado.value && f.estado_convocatoria !== estado.value) continue
    if (tipo.value && f.tipo !== tipo.value) continue
    if (!mapa.has(f.universidad_id)) {
      mapa.set(f.universidad_id, { id: f.universidad_id, nombre: f.universidad_nombre, tipo: f.tipo, ciudad: f.ciudad, facultades: [] })
    }
    mapa.get(f.universidad_id).facultades.push(f)
  }
  return [...mapa.values()]
})
</script>

<template>
  <PageHeader
    titulo="Convocatorias"
    subtitulo="Elige una facultad para ver sus fechas, requisitos y carreras."
  />

  <div class="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
    <button
      v-for="[valor, texto] in ESTADOS"
      :key="valor"
      type="button"
      class="chip"
      :aria-pressed="estado === valor"
      @click="estado = valor"
    >
      {{ texto }}
    </button>
  </div>
  <div class="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de universidad">
    <button
      v-for="[valor, texto] in TIPOS_FILTRO"
      :key="valor"
      type="button"
      class="chip"
      :aria-pressed="tipo === valor"
      @click="tipo = valor"
    >
      {{ texto }}
    </button>
  </div>

  <AsyncState :cargando="cargando" :error="error" :vacio="!grupos.length" @reintentar="ejecutar">
    <section v-for="g in grupos" :key="g.id" class="mb-8" :aria-labelledby="`uni-${g.id}`">
      <h2 :id="`uni-${g.id}`" class="mb-1 text-xl">{{ g.nombre }}</h2>
      <p class="mb-3 text-sm text-ink-soft">{{ TIPOS[g.tipo] }} · {{ g.ciudad }}</p>
      <ul class="grid gap-3 sm:grid-cols-2">
        <li v-for="f in g.facultades" :key="f.id">
          <RouterLink :to="`/convocatorias/${f.id}`" class="card flex h-full flex-col gap-2 hover:border-brand">
            <span class="flex items-start justify-between gap-2">
              <span class="text-lg font-bold">{{ f.nombre }}</span>
              <i class="ti ti-chevron-right mt-1 text-brand" aria-hidden="true"></i>
            </span>
            <span class="text-sm text-ink-soft">{{ f.n_carreras }} {{ f.n_carreras === 1 ? 'carrera' : 'carreras' }} · {{ f.area_nombre }}</span>
            <StatusBadge :estado="f.estado_convocatoria" />
          </RouterLink>
        </li>
      </ul>
    </section>
  </AsyncState>
</template>
