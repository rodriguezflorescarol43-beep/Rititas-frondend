<script setup>
import { watch } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import AsyncState from '../components/AsyncState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import VerifiedTag from '../components/VerifiedTag.vue'
import { descargarIcs, eventosDeConvocatoria } from '../utils/calendario'
import { bs, diasTexto, fecha, MODALIDAD_INGRESO, TIPOS } from '../utils/format'

const props = defineProps({ id: { type: String, required: true } })
const { datos: f, error, cargando, ejecutar } = useAsync(() => api.facultad(props.id))
watch(() => props.id, () => ejecutar())
</script>

<template>
  <RouterLink :to="f ? `/universidades/${f.universidad_id}` : '/universidades'" class="mb-4 inline-flex min-h-11 items-center gap-1 font-bold text-brand underline">
    <i class="ti ti-arrow-left" aria-hidden="true"></i> {{ f ? f.universidad_nombre : 'Universidades' }}
  </RouterLink>

  <AsyncState :cargando="cargando" :error="error" @reintentar="ejecutar">
    <template v-if="f">
      <header class="mb-6">
        <p class="text-sm font-bold text-ink-soft">{{ f.universidad_nombre }} · {{ TIPOS[f.tipo] }} · {{ f.ciudad }}</p>
        <h1 class="mt-1 text-2xl sm:text-3xl">{{ f.nombre }}</h1>
      </header>

      <h2 class="mb-3 text-xl">Convocatoria</h2>
      <p v-if="!f.convocatorias.length" class="card text-ink-soft">
        Esta facultad todavía no tiene una convocatoria cargada. Consulta el sitio de la universidad.
      </p>
      <article v-for="c in f.convocatorias" :key="c.id" class="card mb-4 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-lg">{{ c.titulo }}</h3>
          <StatusBadge :estado="c.estado" />
        </div>
        <p v-if="diasTexto(c.estado, c.dias_restantes)" class="font-bold text-brand">
          <i class="ti ti-clock" aria-hidden="true"></i> {{ diasTexto(c.estado, c.dias_restantes) }}
        </p>
        <dl class="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div><dt class="text-sm text-ink-soft">Inscripción desde</dt><dd class="font-bold">{{ fecha(c.inscripcion_inicio) }}</dd></div>
          <div><dt class="text-sm text-ink-soft">Inscripción hasta</dt><dd class="font-bold">{{ fecha(c.inscripcion_fin) }}</dd></div>
          <div><dt class="text-sm text-ink-soft">Examen</dt><dd class="font-bold">{{ fecha(c.fecha_examen) }}</dd></div>
          <div><dt class="text-sm text-ink-soft">Cómo se ingresa</dt><dd class="font-bold">{{ MODALIDAD_INGRESO[c.modalidad_ingreso] }}</dd></div>
          <div><dt class="text-sm text-ink-soft">Costo de inscripción</dt><dd class="font-bold">{{ bs(c.costo_inscripcion_bs) }}</dd></div>
        </dl>
        <div v-if="c.requisitos">
          <h4 class="text-sm text-ink-soft">Requisitos</h4>
          <p>{{ c.requisitos }}</p>
        </div>
        <button type="button" class="btn-ghost" @click="descargarIcs(`convocatoria-${c.id}`, eventosDeConvocatoria(c, f.nombre))">
          <i class="ti ti-calendar-plus" aria-hidden="true"></i> Guardar fechas en mi calendario
        </button>
        <VerifiedTag :verificado="c.verificado_en" :fuente="c.fuente_url" />
      </article>

      <h2 class="mb-3 mt-8 text-xl">Carreras</h2>
      <ul class="grid gap-3 sm:grid-cols-2">
        <li v-for="c in f.carreras" :key="c.id" class="card">
          <p class="font-bold">{{ c.nombre }}</p>
          <p class="text-sm text-ink-soft">{{ c.duracion_anios }} años</p>
          <p v-if="c.descripcion" class="mt-1">{{ c.descripcion }}</p>
        </li>
      </ul>

      <h2 class="mb-3 mt-8 text-xl">La universidad</h2>
      <div class="card space-y-1">
        <p class="font-bold">{{ f.universidad.nombre }}</p>
        <p>Costo estimado: <strong>{{ bs(f.universidad.costo_mensual_bs) }}</strong> al mes</p>
        <p v-if="f.universidad.becas">Becas: {{ f.universidad.becas }}</p>
        <a v-if="f.universidad.sitio_web" :href="f.universidad.sitio_web" target="_blank" rel="noopener" class="font-bold text-brand underline">Sitio web oficial</a>
        <VerifiedTag :verificado="f.universidad.verificado_en" :fuente="f.universidad.fuente_url" />
      </div>
    </template>
  </AsyncState>
</template>
