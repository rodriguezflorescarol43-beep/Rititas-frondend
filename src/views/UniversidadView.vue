<script setup>
import { computed, watch } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import AsyncState from '../components/AsyncState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VerifiedTag from '../components/VerifiedTag.vue'
import { bs, TIPOS } from '../utils/format'

const props = defineProps({ id: { type: String, required: true } })

// Una universidad: sus datos y, debajo, sus facultades. Cada facultad lleva a su convocatoria.
const { datos: unis } = useAsync(() => api.universidades())
const { datos: facultades, error, cargando, ejecutar } = useAsync(() => api.facultades({ universidad_id: props.id }))
watch(() => props.id, () => ejecutar())

const u = computed(() => (unis.value ?? []).find((x) => String(x.id) === props.id))
</script>

<template>
  <RouterLink to="/universidades" class="mb-4 inline-flex min-h-11 items-center gap-1 font-bold text-brand underline">
    <i class="ti ti-arrow-left" aria-hidden="true"></i> Todas las universidades
  </RouterLink>

  <header v-if="u" class="mb-6 space-y-1">
    <p class="text-sm font-bold text-ink-soft">{{ TIPOS[u.tipo] }} · {{ u.ciudad }} · {{ u.departamento }}</p>
    <h1 class="text-2xl sm:text-3xl">{{ u.nombre }}</h1>
    <p>Costo mensual: <strong>{{ u.costo_mensual_bs == null ? 'por confirmar' : bs(u.costo_mensual_bs) }}</strong></p>
    <p v-if="u.becas"><i class="ti ti-award text-brand" aria-hidden="true"></i> {{ u.becas }}</p>
    <a v-if="u.sitio_web" :href="u.sitio_web" target="_blank" rel="noopener" class="font-bold text-brand underline">Sitio web oficial</a>
    <VerifiedTag :verificado="u.verificado_en" :fuente="u.fuente_url" />
  </header>

  <h2 class="mb-1 text-xl">Facultades</h2>
  <p class="mb-3 text-ink-soft">Elige una facultad para ver su convocatoria: fechas, requisitos y carreras.</p>

  <AsyncState :cargando="cargando" :error="error" :vacio="!facultades?.length" vacio-texto="Esta universidad todavía no tiene facultades cargadas." @reintentar="ejecutar">
    <ul class="grid gap-3 sm:grid-cols-2">
      <li v-for="f in facultades" :key="f.id">
        <RouterLink :to="`/facultades/${f.id}`" class="card flex h-full flex-col gap-2 hover:border-brand">
          <span class="flex items-start justify-between gap-2">
            <span class="text-lg font-bold">{{ f.nombre }}</span>
            <i class="ti ti-chevron-right mt-1 text-brand" aria-hidden="true"></i>
          </span>
          <span class="text-sm text-ink-soft">{{ f.n_carreras }} {{ f.n_carreras === 1 ? 'carrera' : 'carreras' }} · {{ f.area_nombre }}</span>
          <StatusBadge :estado="f.estado_convocatoria" />
        </RouterLink>
      </li>
    </ul>
  </AsyncState>
</template>
