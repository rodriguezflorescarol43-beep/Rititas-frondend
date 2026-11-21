<script setup>
import { computed, ref } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import AsyncState from '../components/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'
import { enlaceWhatsApp } from '../utils/geo'

const { datos, error, cargando, ejecutar } = useAsync(() => api.embajadores())
const universidad = ref('')

const universidades = computed(() => [...new Map((datos.value ?? []).map((e) => [e.universidad_id, e.universidad_nombre]))])
const lista = computed(() => (datos.value ?? []).filter((e) => !universidad.value || e.universidad_id === Number(universidad.value)))
const iniciales = (nombre) => nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
</script>

<template>
  <PageHeader
    titulo="Habla con alguien que ya estudia"
    subtitulo="Estudiantes voluntarios que te cuentan cómo es el examen, la carrera y la vida en su universidad."
  />

  <aside class="card mb-5 bg-brand-soft">
    <p>
      <i class="ti ti-shield-check text-brand" aria-hidden="true"></i>
      Son estudiantes <strong>mayores de 18 años</strong> que aceptaron aparecer aquí. Pregúntales sobre el examen, la
      carrera o las becas, con respeto. No compartas datos tuyos que no quieras dar.
    </p>
  </aside>

  <label v-if="universidades.length > 1" class="mb-5 block max-w-xs">
    <span class="mb-1 block text-sm font-bold text-ink-soft">Universidad</span>
    <select v-model="universidad" class="field">
      <option value="">Todas</option>
      <option v-for="[id, nombre] in universidades" :key="id" :value="id">{{ nombre }}</option>
    </select>
  </label>

  <AsyncState :cargando="cargando" :error="error" :vacio="!lista.length" vacio-texto="Todavía no hay embajadores en esta universidad." @reintentar="ejecutar">
    <ul class="grid gap-4 sm:grid-cols-2">
      <li v-for="(e, i) in lista" :key="e.id" class="card aparece flex flex-col gap-2" :style="{ '--i': i }">
        <div class="flex items-center gap-3">
          <span class="grid size-12 shrink-0 place-items-center rounded-full bg-night font-display text-lg font-semibold text-mint" aria-hidden="true">{{ iniciales(e.nombre) }}</span>
          <div>
            <h2 class="text-lg">{{ e.nombre }}</h2>
            <p class="text-sm text-ink-soft">{{ e.carrera }} · {{ e.universidad_nombre }}</p>
          </div>
        </div>
        <p v-if="e.mensaje" class="text-lg">«{{ e.mensaje }}»</p>
        <a
          v-if="e.whatsapp"
          :href="enlaceWhatsApp(e.whatsapp, `Hola ${e.nombre}, vi tu perfil en la guía de ingreso y quisiera hacerte unas preguntas sobre ${e.carrera}.`)"
          target="_blank"
          rel="noopener"
          class="btn-primary mt-auto"
        >
          <i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Escribirle por WhatsApp
        </a>
      </li>
    </ul>
  </AsyncState>

  <RouterLink
    :to="{ path: '/contacto', query: { asunto: 'embajador' } }"
    class="mt-6 block rounded-2xl border-2 border-dashed border-line-strong p-4 text-center text-ink-soft hover:border-brand hover:text-brand"
  >
    ¿Estudias en una universidad y quieres ayudar? <strong>Sé embajador o embajadora.</strong>
  </RouterLink>
</template>
