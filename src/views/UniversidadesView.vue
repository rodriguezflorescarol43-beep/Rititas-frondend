<script setup>
import { computed, ref, watch } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import { ahorro } from '../composables/useAhorro'
import AsyncState from '../components/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'
import RedesContacto from '../components/RedesContacto.vue'
import VerifiedTag from '../components/VerifiedTag.vue'
import { descripcionUniversidad, TIPOS } from '../utils/format'

// Solo públicas y privadas (la página es para Cochabamba).
const tipo = ref('')
const FILTROS = [['', 'Todas'], ['publica', 'Públicas'], ['privada', 'Privadas']]

const { datos, error, cargando, ejecutar } = useAsync(() => api.universidades({ tipo: tipo.value }))
const { datos: facultades } = useAsync(() => api.facultades())
watch(tipo, () => ejecutar())

const facultadesDe = computed(() => {
  const mapa = new Map()
  for (const f of facultades.value ?? []) mapa.set(f.universidad_id, [...(mapa.get(f.universidad_id) ?? []), f])
  return mapa
})
</script>

<template>
  <PageHeader titulo="Universidades" subtitulo="Públicas y privadas. Compara dónde están." />

  <div class="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
    <button
      v-for="[valor, texto] in FILTROS"
      :key="valor"
      type="button"
      class="chip"
      :aria-pressed="tipo === valor"
      @click="tipo = valor"
    >
      {{ texto }}
    </button>
  </div>

  <AsyncState :cargando="cargando" :error="error" :vacio="!datos?.length" @reintentar="ejecutar">
    <ul class="grid gap-4 sm:grid-cols-2">
      <li v-for="u in datos" :key="u.id" class="card flex flex-col gap-2">
        <img v-if="u.imagen_url && !ahorro" :src="u.imagen_url" :alt="`Imagen de ${u.nombre}`" class="-mx-1 -mt-1 h-40 w-[calc(100%+0.5rem)] rounded-xl object-cover" loading="lazy" />
        <div class="flex items-start justify-between gap-2">
          <h2 class="text-lg">{{ u.nombre }}</h2>
          <span class="chip shrink-0 !min-h-0 !py-0.5">{{ TIPOS[u.tipo] }}</span>
        </div>
        <p class="text-sm text-ink-soft">{{ u.ciudad }} · {{ u.departamento }}</p>
        <p>{{ descripcionUniversidad(u, facultadesDe.get(u.id)) }}</p>
        <RedesContacto :item="u" />
        <VerifiedTag :verificado="u.verificado_en" :fuente="u.fuente_url" />
        <RouterLink :to="`/universidades/${u.id}`" class="btn-ghost mt-auto">
          Ver facultades y convocatorias
        </RouterLink>
      </li>
    </ul>
  </AsyncState>
</template>
