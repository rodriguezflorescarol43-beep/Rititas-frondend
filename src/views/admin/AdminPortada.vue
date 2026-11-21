<script setup>
import { computed, ref } from 'vue'
import { adminApi } from '../../api/admin'
import { pedir } from '../../api/client'
import AsyncState from '../../components/AsyncState.vue'
import { useAsync } from '../../composables/useAsync'

const form = ref(null)
const guardando = ref(false)
const aviso = ref('')
const errorForm = ref('')

const { datos: medios } = useAsync(() => adminApi.medios())
const { error, cargando, ejecutar } = useAsync(async () => {
  form.value = { ...(await pedir('/ajustes')) } // el panel siempre lee lo más reciente, no lo guardado
})

const imagenes = computed(() => (medios.value ?? []).filter((m) => m.tipo === 'imagen'))
const videos = computed(() => (medios.value ?? []).filter((m) => m.tipo === 'video'))

async function guardar() {
  aviso.value = ''
  errorForm.value = ''
  guardando.value = true
  try {
    form.value = { ...(await adminApi.guardarAjustes(form.value)) }
    aviso.value = 'Portada actualizada. Ya se ve en la página.'
  } catch (e) {
    errorForm.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <h1 class="mb-1 text-2xl">Portada</h1>
  <p class="mb-6 text-ink-soft">El título, el texto, la imagen y el video que se ven al entrar a la página.</p>

  <AsyncState :cargando="cargando" :error="error" @reintentar="ejecutar">
    <form v-if="form" class="grid gap-6 lg:grid-cols-2" @submit.prevent="guardar">
      <div class="card space-y-4">
        <div>
          <label for="p-titulo" class="mb-1 block font-bold">Título</label>
          <input id="p-titulo" v-model="form.portada_titulo" class="field" maxlength="120" />
        </div>
        <div>
          <label for="p-texto" class="mb-1 block font-bold">Texto de apoyo</label>
          <textarea id="p-texto" v-model="form.portada_texto" rows="3" class="field" maxlength="300"></textarea>
        </div>
        <div>
          <label for="p-imagen" class="mb-1 block font-bold">Imagen de fondo</label>
          <select id="p-imagen" v-model="form.portada_imagen" class="field">
            <option value="">Sin imagen</option>
            <option v-for="m in imagenes" :key="m.id" :value="m.url">{{ m.nombre }}</option>
          </select>
        </div>
        <div>
          <label for="p-video" class="mb-1 block font-bold">Video</label>
          <select id="p-video" v-model="form.portada_video" class="field">
            <option value="">Sin video</option>
            <option v-for="m in videos" :key="m.id" :value="m.url">{{ m.nombre }}</option>
          </select>
          <p class="mt-1 text-sm text-ink-soft">El video no se reproduce solo, para no gastar los datos de quien lo ve.</p>
        </div>
        <p v-if="errorForm" role="alert" class="font-bold text-bad-fg">{{ errorForm }}</p>
        <p v-if="aviso" role="status" class="font-bold text-ok-fg"><i class="ti ti-circle-check" aria-hidden="true"></i> {{ aviso }}</p>
        <button type="submit" class="btn-primary" :aria-busy="guardando">{{ guardando ? 'Guardando…' : 'Guardar portada' }}</button>
      </div>

      <section aria-label="Vista previa" class="self-start">
        <p class="mb-2 text-sm font-bold text-ink-soft">Vista previa</p>
        <div
          class="relative overflow-hidden rounded-3xl bg-night p-6 text-white"
          :style="form.portada_imagen ? { backgroundImage: `url(${form.portada_imagen})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
        >
          <div :class="form.portada_imagen ? 'rounded-2xl bg-night/85 p-4' : ''">
            <h2 class="text-2xl">{{ form.portada_titulo }}</h2>
            <p class="mt-2 text-white/90">{{ form.portada_texto }}</p>
          </div>
        </div>
        <video v-if="form.portada_video" :src="form.portada_video" class="mt-3 w-full rounded-2xl" controls preload="none"></video>
      </section>
    </form>
  </AsyncState>
</template>
