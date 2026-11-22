<script setup>
import { computed, onMounted, ref } from 'vue'
import { ahorro, ahorroAutomatico, ahorroManual, fijarAhorro } from '../composables/useAhorro'
import PageHeader from '../components/PageHeader.vue'
import { actualizarPaquete, estadoPaquete, paqueteActual } from '../datos/paquete'
import { DEPARTAMENTOS } from '../config'
import { fecha } from '../utils/format'

// ---------- estado de los datos ----------
const version = computed(() => estadoPaquete.version)
const esEjemplo = computed(() => !version.value || version.value.startsWith('1970'))
const kb = computed(() => {
  void estadoPaquete.version
  const p = paqueteActual()
  return p ? Math.max(1, Math.round(new Blob([p.datos]).size / 1024)) : null
})
const mensaje = ref('')
const errorMensaje = ref('')

async function actualizar() {
  mensaje.value = ''
  errorMensaje.value = ''
  try {
    const cambio = await actualizarPaquete()
    mensaje.value = cambio ? 'Listo: tus datos se actualizaron.' : 'Ya tienes los datos más recientes.'
  } catch (e) {
    errorMensaje.value = e.sinConexion ? 'No hay señal ahora. Inténtalo cuando tengas conexión.' : e.message
  }
}

// ---------- ¿estoy listo para usar sin señal? ----------
const paginaInstalada = ref(false)
onMounted(async () => {
  try {
    const registro = await navigator.serviceWorker?.getRegistration()
    paginaInstalada.value = !!registro?.active
  } catch {
    paginaInstalada.value = false
  }
})
const listo = computed(() => paginaInstalada.value && !!paqueteActual())

// ---------- guardar las imágenes de mi departamento ----------
const departamento = ref(DEPARTAMENTOS[0])
const imagenes = ref({ estado: 'reposo', total: 0 })
async function guardarImagenes() {
  const datos = paqueteActual()?.datosObj
  if (!datos) return
  const urls = new Set()
  for (const u of datos.universidades) if (u.imagen_url && (!departamento.value || u.departamento === departamento.value)) urls.add(u.imagen_url)
  for (const f of datos.facultades) if (f.convocatoria_imagen_url) urls.add(f.convocatoria_imagen_url)
  for (const p of datos.preuniversitarios) if (p.imagen_url && (!departamento.value || p.departamento === departamento.value)) urls.add(p.imagen_url)
  if (datos.ajustes.portada_imagen) urls.add(datos.ajustes.portada_imagen)
  imagenes.value = { estado: 'guardando', total: urls.size }
  await Promise.all([...urls].map((url) => new Promise((resolver) => {
    const img = new Image() // cargarla como imagen hace que el teléfono la guarde para verla sin señal
    img.onload = img.onerror = resolver
    img.src = url
  })))
  imagenes.value = { estado: 'listo', total: urls.size }
}

const OPCIONES_AHORRO = [
  [null, 'Automático'],
  ['si', 'Activado'],
  ['no', 'Desactivado'],
]
</script>

<template>
  <PageHeader
    titulo="Usar sin señal"
    subtitulo="La página se guarda en tu teléfono. Con señal débil o sin señal, sigue funcionando con lo último que guardó."
  />

  <div class="grid gap-5 lg:grid-cols-2">
    <section class="card space-y-3" aria-labelledby="s-estado">
      <h2 id="s-estado" class="text-lg">Tus datos guardados</h2>
      <p v-if="version">
        <strong>{{ esEjemplo ? 'Datos de ejemplo' : `Datos del ${fecha(version.slice(0, 10))}` }}</strong>
        <span v-if="kb" class="text-ink-soft"> · unos {{ kb }} KB</span>
      </p>
      <p v-else class="text-ink-soft">Todavía no hay datos guardados. Conéctate un momento y se guardan solos.</p>
      <ul class="space-y-1">
        <li>{{ paginaInstalada ? '✔' : '○' }} La página está instalada en tu teléfono</li>
        <li>{{ version ? '✔' : '○' }} Los datos están guardados</li>
      </ul>
      <p v-if="listo" class="rounded-xl bg-ok-bg p-3 font-bold text-ok-fg">✔ Listo para usar sin señal</p>
      <button type="button" class="btn-ghost" :aria-busy="estadoPaquete.actualizando" @click="actualizar">
        <i class="ti ti-refresh" aria-hidden="true"></i> {{ estadoPaquete.actualizando ? 'Actualizando…' : 'Actualizar ahora' }}
      </button>
      <p v-if="mensaje" role="status" class="font-bold text-ok-fg">{{ mensaje }}</p>
      <p v-if="errorMensaje" role="alert" class="font-bold text-bad-fg">{{ errorMensaje }}</p>
      <p class="text-sm text-ink-soft">Si nada cambió, la actualización casi no gasta datos.</p>
    </section>

    <section class="card space-y-3" aria-labelledby="s-ahorro">
      <h2 id="s-ahorro" class="text-lg">Modo ahorro de datos</h2>
      <p class="text-ink-soft">No carga fotos pesadas. Si tu señal es muy lenta, se activa solo.</p>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Modo ahorro de datos">
        <button v-for="[valor, texto] in OPCIONES_AHORRO" :key="String(valor)" type="button" class="chip" :aria-pressed="ahorroManual === valor" @click="fijarAhorro(valor)">
          {{ texto }}
        </button>
      </div>
      <p class="text-sm">
        Ahora está <strong>{{ ahorro ? 'activado' : 'desactivado' }}</strong>
        <span v-if="ahorroManual === null && ahorroAutomatico"> porque tu conexión parece lenta.</span>.
      </p>

      <div class="border-t-2 border-line pt-3">
        <h3 class="text-base">Guardar las fotos de mi departamento</h3>
        <label class="mt-2 block max-w-xs">
          <span class="sr-only">Departamento</span>
          <select v-model="departamento" class="field">
            <option v-for="d in DEPARTAMENTOS" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <button type="button" class="btn-ghost mt-2" @click="guardarImagenes">
          <i class="ti ti-photo" aria-hidden="true"></i> Guardar fotos
        </button>
        <p v-if="imagenes.estado === 'guardando'" role="status" class="mt-2">Guardando {{ imagenes.total }} fotos…</p>
        <p v-else-if="imagenes.estado === 'listo'" role="status" class="mt-2 font-bold text-ok-fg">
          {{ imagenes.total ? `Se guardaron ${imagenes.total} fotos.` : 'No hay fotos para guardar todavía.' }}
        </p>
      </div>
    </section>
  </div>
</template>
