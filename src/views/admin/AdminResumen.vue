<script setup>
import { adminApi } from '../../api/admin'
import AsyncState from '../../components/AsyncState.vue'
import { useAsync } from '../../composables/useAsync'

const { datos, error, cargando, ejecutar } = useAsync(() => adminApi.resumen())
const { datos: revision } = useAsync(() => adminApi.revision())

const TARJETAS = [
  ['universidades', 'Universidades', 'ti-building-community'],
  ['facultades', 'Facultades', 'ti-books'],
  ['carreras', 'Carreras', 'ti-certificate'],
  ['convocatorias', 'Convocatorias', 'ti-calendar-event'],
  ['preuniversitarios', 'Preuniversitarios', 'ti-school'],
  ['medios', 'Imágenes y videos', 'ti-photo-video'],
  ['mensajes', 'Mensajes', 'ti-mail'],
]
const RUTA = { medios: '/admin/medios', mensajes: '/admin/mensajes' }
</script>

<template>
  <h1 class="mb-1 text-2xl">Resumen</h1>
  <p class="mb-6 text-ink-soft">Lo que hay cargado en la página ahora mismo.</p>

  <RouterLink v-if="revision" to="/admin/revision" class="card mb-5 flex items-center gap-4 hover:border-brand">
    <i class="ti ti-checklist text-4xl text-brand" aria-hidden="true"></i>
    <span>
      <span class="block text-lg font-bold">Qué revisar hoy</span>
      <span v-if="revision.hallazgos.length" class="text-ink-soft">
        <strong class="text-bad-fg">▲ {{ revision.resumen.alta }} urgentes</strong> ·
        ◆ {{ revision.resumen.media }} importantes · ○ {{ revision.resumen.baja }} menores
      </span>
      <span v-else class="font-bold text-ok-fg">✔ Todo en orden</span>
    </span>
  </RouterLink>

  <AsyncState :cargando="cargando" :error="error" @reintentar="ejecutar">
    <ul v-if="datos" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="[clave, titulo, icono] in TARJETAS" :key="clave">
        <RouterLink :to="RUTA[clave] ?? `/admin/${clave}`" class="card flex items-center gap-4 hover:border-brand">
          <i class="ti text-4xl text-brand" :class="icono" aria-hidden="true"></i>
          <span>
            <span class="block text-3xl font-bold">{{ datos[clave] }}</span>
            <span class="text-ink-soft">{{ titulo }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </AsyncState>

  <section class="card mt-8 bg-brand-soft">
    <h2 class="text-lg">Antes de publicar</h2>
    <ul class="mt-2 list-disc space-y-1 pl-5">
      <li>En cada convocatoria y universidad llena la <strong>fuente oficial</strong> y la <strong>fecha de verificación</strong>.</li>
      <li>Sin fecha de verificación, la página muestra «Dato de ejemplo · sin verificar».</li>
      <li>Reemplaza los datos de ejemplo por los reales antes de compartir la página.</li>
    </ul>
  </section>
</template>
