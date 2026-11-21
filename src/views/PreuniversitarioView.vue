<script setup>
import { computed, ref } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import AsyncState from '../components/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'

const { datos: meta, error, cargando, ejecutar } = useAsync(() => api.meta())
const { datos: preus } = useAsync(() => api.preuniversitarios())

const busqueda = ref('')
const normal = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Una tarjeta por tipo de facultad, con cuántos preuniversitarios preparan para ella.
const tipos = computed(() =>
  Object.entries(meta.value?.facultades_tipo ?? {})
    .map(([clave, t]) => ({
      clave,
      ...t,
      cantidad: (preus.value ?? []).filter((p) => (p.facultades_tipos || '').split(',').includes(clave)).length,
    }))
    .filter((t) => normal(t.nombre).includes(normal(busqueda.value)))
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)),
)
</script>

<template>
  <PageHeader
    titulo="Preuniversitario"
    nota="(institutos)"
    subtitulo="Elige la facultad a la que quieres postularte y mira quién te prepara, cuánto cuesta y cómo llegar."
  />

  <AsyncState :cargando="cargando" :error="error" @reintentar="ejecutar">
    <section aria-labelledby="t-facultad">
      <h2 id="t-facultad" class="text-xl">¿A qué facultad quieres postularte?</h2>
      <p class="mb-3 text-ink-soft">Elige una para ver quién te prepara.</p>

      <label class="relative mb-4 block">
        <span class="sr-only">Buscar facultad</span>
        <i class="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-ink-soft" aria-hidden="true"></i>
        <input v-model="busqueda" type="search" class="field !pl-10" placeholder="Buscar facultad" />
      </label>

      <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li v-for="(t, i) in tipos" :key="t.clave" class="aparece" :style="{ '--i': i }">
          <RouterLink :to="`/preuniversitario/facultad/${t.clave}`" class="card sube flex h-full flex-col gap-2 hover:border-brand">
            <i class="ti text-3xl text-brand" :class="t.icono" aria-hidden="true"></i>
            <span class="text-lg font-bold leading-tight">{{ t.nombre }}</span>
            <span class="text-sm text-ink-soft">{{ t.cantidad }} {{ t.cantidad === 1 ? 'preuniversitario' : 'preuniversitarios' }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-if="!tipos.length" class="card mt-3 text-center text-ink-soft">No encontramos esa facultad. Prueba con otra palabra.</p>

      <RouterLink to="/preuniversitario/facultad/todos" class="btn-ghost mt-4">
        <i class="ti ti-list" aria-hidden="true"></i> Ver todos los preuniversitarios
      </RouterLink>
    </section>

    <aside class="card mt-8 bg-brand-soft">
      <h2 class="text-lg">¿Examen directo o preuniversitario?</h2>
      <p class="mt-1">
        Un preuniversitario es un curso para prepararte antes del examen de ingreso. Cada facultad decide cómo se
        ingresa: por examen, por preuniversitario o por ambos. Mira la modalidad en cada
        <RouterLink to="/convocatorias" class="font-bold text-brand underline">convocatoria</RouterLink>.
      </p>
    </aside>
  </AsyncState>
</template>
