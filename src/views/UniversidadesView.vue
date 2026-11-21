<script setup>
import { ref, watch } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import { ahorro } from '../composables/useAhorro'
import AsyncState from '../components/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'
import VerifiedTag from '../components/VerifiedTag.vue'
import { bs, TIPOS } from '../utils/format'

const tipo = ref('')
const departamento = ref('')
const FILTROS = [['', 'Todas'], ...Object.entries(TIPOS).map(([k, v]) => [k, `${v}s`])]

const { datos: meta } = useAsync(() => api.meta())
const { datos, error, cargando, ejecutar } = useAsync(() =>
  api.universidades({ tipo: tipo.value, departamento: departamento.value }),
)
watch([tipo, departamento], () => ejecutar())
</script>

<template>
  <PageHeader
    titulo="Universidades"
    subtitulo="Públicas, privadas y técnicas. Compara dónde están, cuánto cuestan y qué becas ofrecen."
  />

  <div class="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
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
  <label class="mb-6 block max-w-xs">
    <span class="mb-1 block text-sm font-bold text-ink-soft">Departamento</span>
    <select v-model="departamento" class="field">
      <option value="">Todos</option>
      <option v-for="d in meta?.departamentos ?? []" :key="d" :value="d">{{ d }}</option>
    </select>
  </label>

  <AsyncState :cargando="cargando" :error="error" :vacio="!datos?.length" @reintentar="ejecutar">
    <ul class="grid gap-4 sm:grid-cols-2">
      <li v-for="u in datos" :key="u.id" class="card flex flex-col gap-2">
        <img v-if="u.imagen_url && !ahorro":src="u.imagen_url" :alt="`Imagen de ${u.nombre}`" class="-mx-1 -mt-1 h-40 w-[calc(100%+0.5rem)] rounded-xl object-cover" loading="lazy" />
        <div class="flex items-start justify-between gap-2">
          <h2 class="text-lg">{{ u.nombre }}</h2>
          <span class="chip shrink-0 !min-h-0 !py-0.5">{{ TIPOS[u.tipo] }}</span>
        </div>
        <p class="text-sm text-ink-soft">{{ u.ciudad }} · {{ u.departamento }}</p>
        <p>Costo estimado: <strong>{{ bs(u.costo_mensual_bs) }}</strong> al mes</p>
        <p v-if="u.becas"><i class="ti ti-award text-brand" aria-hidden="true"></i> {{ u.becas }}</p>
        <a v-if="u.sitio_web" :href="u.sitio_web" target="_blank" rel="noopener" class="font-bold text-brand underline">Sitio web oficial</a>
        <VerifiedTag :verificado="u.verificado_en" :fuente="u.fuente_url" />
        <RouterLink :to="{ path: '/convocatorias', query: { uni: u.id } }" class="btn-ghost mt-auto">
          Ver facultades y convocatorias
        </RouterLink>
      </li>
    </ul>
  </AsyncState>
</template>
