<script setup>
import { computed, ref } from 'vue'
import { adminApi } from '../../api/admin'
import AsyncState from '../../components/AsyncState.vue'
import { useAsync } from '../../composables/useAsync'

const { datos, error, cargando, ejecutar } = useAsync(() => adminApi.revision())

const nivel = ref('')
const recurso = ref('')
const NIVELES = [
  ['alta', '▲ Urgente', 'bg-bad-bg text-bad-fg'],
  ['media', '◆ Importante', 'bg-warn-bg text-warn-fg'],
  ['baja', '○ Menor', 'bg-off-bg text-off-fg'],
]
const ETIQUETA = Object.fromEntries(NIVELES.map(([k, t, c]) => [k, { texto: t, clases: c }]))
const NOMBRES = {
  universidades: 'Universidades', facultades: 'Facultades', carreras: 'Carreras',
  convocatorias: 'Convocatorias', preuniversitarios: 'Preuniversitarios',
}

const lista = computed(() =>
  (datos.value?.hallazgos ?? []).filter((h) => (!nivel.value || h.severidad === nivel.value) && (!recurso.value || h.recurso === recurso.value)),
)
const recursos = computed(() => [...new Set((datos.value?.hallazgos ?? []).map((h) => h.recurso))])
</script>

<template>
  <h1 class="mb-1 text-2xl">Qué revisar hoy</h1>
  <p class="mb-2 max-w-3xl text-ink-soft">
    El Detective revisa toda la base y te dice qué mirar primero: lo que cierra pronto sin verificar, fechas raras,
    costos fuera de lo normal y posibles duplicados.
  </p>
  <p class="mb-6 text-sm text-ink-soft">
    <i class="ti ti-info-circle" aria-hidden="true"></i>
    Son reglas y estadística simple (medianas y comparación de nombres). No usa IA externa ni envía datos a ningún lado.
  </p>

  <AsyncState :cargando="cargando" :error="error" @reintentar="ejecutar">
    <template v-if="datos">
      <div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por urgencia">
        <button type="button" class="chip" :aria-pressed="nivel === ''" @click="nivel = ''">Todos ({{ datos.hallazgos.length }})</button>
        <button v-for="[clave, texto] in NIVELES" :key="clave" type="button" class="chip" :aria-pressed="nivel === clave" @click="nivel = clave">
          {{ texto }} ({{ datos.resumen[clave] }})
        </button>
      </div>
      <label v-if="recursos.length > 1" class="mb-5 block max-w-xs">
        <span class="mb-1 block text-sm font-bold text-ink-soft">Tipo de dato</span>
        <select v-model="recurso" class="field">
          <option value="">Todos</option>
          <option v-for="r in recursos" :key="r" :value="r">{{ NOMBRES[r] }}</option>
        </select>
      </label>

      <p v-if="!datos.hallazgos.length" class="card border-ok-fg bg-ok-bg font-bold text-ok-fg">
        ✔ Todo en orden. El Detective no encontró nada que revisar.
      </p>
      <p v-else-if="!lista.length" class="card text-center text-ink-soft">No hay avisos con ese filtro.</p>

      <ul class="space-y-3">
        <li v-for="h in lista" :key="h.clave" class="card">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <h2 class="text-lg">{{ h.titulo }}</h2>
            <span class="rounded-full px-3 py-1 text-sm font-bold" :class="ETIQUETA[h.severidad].clases">{{ ETIQUETA[h.severidad].texto }}</span>
          </div>
          <p class="mt-1">{{ h.detalle }}</p>
          <p class="mt-1 text-ink-soft"><strong>Qué hacer:</strong> {{ h.sugerencia }}</p>
          <RouterLink :to="{ path: `/admin/${h.recurso}`, query: { editar: h.fila_id } }" class="btn-ghost mt-3 !min-h-10 !px-4 !py-1.5 text-sm">
            <i class="ti ti-pencil" aria-hidden="true"></i> Abrir y corregir
          </RouterLink>
        </li>
      </ul>
    </template>
  </AsyncState>
</template>
