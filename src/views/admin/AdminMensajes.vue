<script setup>
import { ref } from 'vue'
import { adminApi } from '../../api/admin'
import AsyncState from '../../components/AsyncState.vue'
import { useAsync } from '../../composables/useAsync'

const { datos: mensajes, error, cargando, ejecutar } = useAsync(() => adminApi.mensajes())
const confirmando = ref(null)
const errorBorrar = ref('')

const cuando = (iso) =>
  new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`).toLocaleString('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

async function borrar(id) {
  errorBorrar.value = ''
  try {
    await adminApi.borrarMensaje(id)
    confirmando.value = null
    await ejecutar()
  } catch (e) {
    confirmando.value = null
    errorBorrar.value = e.message
  }
}
</script>

<template>
  <h1 class="mb-1 text-2xl">Mensajes</h1>
  <p class="mb-6 text-ink-soft">Lo que escribieron desde la página de contacto.</p>

  <p v-if="errorBorrar" role="alert" class="card mb-4 border-bad-fg bg-bad-bg font-bold text-bad-fg">{{ errorBorrar }}</p>

  <AsyncState :cargando="cargando" :error="error" :vacio="!mensajes?.length" vacio-texto="No hay mensajes todavía." @reintentar="ejecutar">
    <ul class="space-y-3">
      <li v-for="m in mensajes" :key="m.id" class="card">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="font-bold">{{ m.nombre }} · <a :href="`mailto:${m.email}`" class="text-brand underline">{{ m.email }}</a></p>
          <p class="text-sm text-ink-soft">{{ cuando(m.creado_en) }}</p>
        </div>
        <p class="mt-2 whitespace-pre-line">{{ m.mensaje }}</p>
        <div class="mt-3">
          <template v-if="confirmando === m.id">
            <span class="mr-2 font-bold text-bad-fg">¿Borrar?</span>
            <button type="button" class="btn-ghost !min-h-10 !border-bad-fg !px-3 !py-1 text-sm !text-bad-fg" @click="borrar(m.id)">Sí, borrar</button>
            <button type="button" class="btn-ghost ml-1 !min-h-10 !px-3 !py-1 text-sm" @click="confirmando = null">No</button>
          </template>
          <button v-else type="button" class="btn-ghost !min-h-10 !px-3 !py-1 text-sm" :aria-label="`Borrar mensaje de ${m.nombre}`" @click="confirmando = m.id">
            <i class="ti ti-trash" aria-hidden="true"></i> Borrar
          </button>
        </div>
      </li>
    </ul>
  </AsyncState>
</template>
