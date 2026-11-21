<script setup>
import { ref } from 'vue'
import { adminApi } from '../../api/admin'
import AsyncState from '../../components/AsyncState.vue'
import { useAsync } from '../../composables/useAsync'

const MB = 1024 * 1024
const LIMITE = { imagen: 5 * MB, video: 40 * MB }

const { datos: medios, error, cargando, ejecutar } = useAsync(() => adminApi.medios())
const subiendo = ref(false)
const problemas = ref([])
const aviso = ref('')
const confirmando = ref(null)
const errorBorrar = ref('')

const tamano = (bytes) => (bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

async function elegir(evento) {
  const archivos = [...evento.target.files]
  evento.target.value = ''
  problemas.value = []
  aviso.value = ''
  subiendo.value = true
  let subidos = 0
  for (const archivo of archivos) {
    const tipo = archivo.type.startsWith('video/') ? 'video' : 'imagen'
    if (archivo.size > LIMITE[tipo]) {
      problemas.value.push(`${archivo.name}: supera el máximo de ${LIMITE[tipo] / MB} MB para ${tipo === 'video' ? 'videos' : 'imágenes'}.`)
      continue
    }
    try {
      await adminApi.subirMedio(archivo)
      subidos++
    } catch (e) {
      problemas.value.push(`${archivo.name}: ${e.sinConexion ? 'sin conexión con el servidor' : e.message}`)
    }
  }
  subiendo.value = false
  if (subidos) aviso.value = subidos === 1 ? 'Se subió 1 archivo.' : `Se subieron ${subidos} archivos.`
  await ejecutar()
}

async function borrar(id) {
  errorBorrar.value = ''
  try {
    await adminApi.borrarMedio(id)
    confirmando.value = null
    await ejecutar()
  } catch (e) {
    confirmando.value = null
    errorBorrar.value = e.message
  }
}
</script>

<template>
  <h1 class="mb-1 text-2xl">Imágenes y videos</h1>
  <p class="mb-6 text-ink-soft">
    Sube aquí lo que quieras usar en la página. Imágenes PNG, JPG, WEBP o GIF de hasta 5 MB. Videos MP4 o WEBM de hasta 40 MB.
  </p>

  <label
    class="card mb-4 flex cursor-pointer flex-col items-center gap-2 border-dashed py-8 text-center hover:border-brand has-[:focus-visible]:border-brand"
  >
    <i class="ti ti-cloud-upload text-4xl text-brand" aria-hidden="true"></i>
    <span class="text-lg font-bold">{{ subiendo ? 'Subiendo…' : 'Elegir archivos para subir' }}</span>
    <span class="text-sm text-ink-soft">Puedes elegir varios a la vez</span>
    <input
      type="file"
      multiple
      class="sr-only"
      accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
      :disabled="subiendo"
      @change="elegir"
    />
  </label>

  <p v-if="aviso" role="status" class="card mb-4 border-ok-fg bg-ok-bg font-bold text-ok-fg">
    <i class="ti ti-circle-check" aria-hidden="true"></i> {{ aviso }}
  </p>
  <ul v-if="problemas.length" role="alert" class="card mb-4 space-y-1 border-bad-fg bg-bad-bg font-bold text-bad-fg">
    <li v-for="p in problemas" :key="p">{{ p }}</li>
  </ul>
  <p v-if="errorBorrar" role="alert" class="card mb-4 border-bad-fg bg-bad-bg font-bold text-bad-fg">{{ errorBorrar }}</p>

  <AsyncState :cargando="cargando" :error="error" :vacio="!medios?.length" vacio-texto="Todavía no subiste nada." @reintentar="ejecutar">
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="m in medios" :key="m.id" class="card flex flex-col gap-2 !p-3">
        <img v-if="m.tipo === 'imagen'" :src="m.url" :alt="`Vista previa de ${m.nombre}`" class="h-40 w-full rounded-xl object-cover" loading="lazy" />
        <video v-else :src="m.url" class="h-40 w-full rounded-xl bg-ink object-cover" controls preload="none" :aria-label="`Video ${m.nombre}`"></video>
        <p class="break-all font-bold">{{ m.nombre }}</p>
        <p class="text-sm text-ink-soft">{{ m.tipo === 'video' ? 'Video' : 'Imagen' }} · {{ tamano(m.tamano_bytes) }}</p>
        <div class="mt-auto">
          <template v-if="confirmando === m.id">
            <span class="mr-2 font-bold text-bad-fg">¿Borrar?</span>
            <button type="button" class="btn-ghost !min-h-10 !border-bad-fg !px-3 !py-1 text-sm !text-bad-fg" @click="borrar(m.id)">Sí, borrar</button>
            <button type="button" class="btn-ghost ml-1 !min-h-10 !px-3 !py-1 text-sm" @click="confirmando = null">No</button>
          </template>
          <button v-else type="button" class="btn-ghost !min-h-10 !px-3 !py-1 text-sm" :aria-label="`Borrar ${m.nombre}`" @click="confirmando = m.id">
            <i class="ti ti-trash" aria-hidden="true"></i> Borrar
          </button>
        </div>
      </li>
    </ul>
  </AsyncState>
</template>
