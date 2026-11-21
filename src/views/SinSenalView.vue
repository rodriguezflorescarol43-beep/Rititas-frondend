<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import { ahorro, ahorroAutomatico, ahorroManual, fijarAhorro } from '../composables/useAhorro'
import PageHeader from '../components/PageHeader.vue'
import {
  actualizarPaquete,
  archivoParaCompartir,
  estadoPaquete,
  importarArchivo,
  paqueteActual,
} from '../datos/paquete'
import { fecha } from '../utils/format'

const { datos: meta } = useAsync(() => api.meta())

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
const departamento = ref('')
const imagenes = ref({ estado: 'reposo', total: 0 })
async function guardarImagenes() {
  const datos = paqueteActual()?.datosObj
  if (!datos) return
  const urls = new Set()
  for (const u of datos.universidades) if (u.imagen_url && (!departamento.value || u.departamento === departamento.value)) urls.add(u.imagen_url)
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

// ---------- compartir y recibir el paquete (por ejemplo, por WhatsApp) ----------
const compartido = ref('')
async function compartir() {
  compartido.value = ''
  const f = archivoParaCompartir()
  if (!f) {
    compartido.value = 'Todavía no hay datos guardados para compartir. Conéctate un momento y vuelve a intentarlo.'
    return
  }
  try {
    if (navigator.canShare?.({ files: [f.archivo] })) {
      await navigator.share({ files: [f.archivo], title: 'Datos de la guía de ingreso', text: 'Abre este archivo en la página, en «Usar sin señal».' })
      return
    }
  } catch (e) {
    if (e.name === 'AbortError') return
  }
  const url = URL.createObjectURL(f.archivo)
  const a = document.createElement('a')
  a.href = url
  a.download = f.nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  compartido.value = `Se guardó el archivo «${f.nombre}». Envíalo por WhatsApp a quien lo necesite.`
}

const recibido = ref('')
const errorRecibido = ref('')
async function recibir(evento) {
  recibido.value = ''
  errorRecibido.value = ''
  const archivo = evento.target.files?.[0]
  evento.target.value = ''
  if (!archivo) return
  if (archivo.size > 5 * 1024 * 1024) {
    errorRecibido.value = 'El archivo es demasiado grande para ser un paquete de datos.'
    return
  }
  try {
    const nueva = await importarArchivo(await archivo.text())
    recibido.value = `Listo: tus datos ahora son del ${fecha(nueva.slice(0, 10))}. El sello es válido.`
  } catch (e) {
    errorRecibido.value = e.message
  }
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
            <option value="">Todos los departamentos</option>
            <option v-for="d in meta?.departamentos ?? []" :key="d" :value="d">{{ d }}</option>
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

    <section class="card space-y-3 lg:col-span-2" aria-labelledby="s-compartir">
      <h2 id="s-compartir" class="text-lg">Pasar los datos por WhatsApp</h2>
      <p class="max-w-3xl text-ink-soft">
        Si alguien tiene señal y tú casi no, puede enviarte un archivo con todos los datos actualizados. El archivo lleva
        un <strong>sello digital</strong>: si alguien cambia una sola fecha o costo, la página lo rechaza.
      </p>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <h3 class="text-base">Compartir mis datos</h3>
          <button type="button" class="btn-primary" @click="compartir">
            <i class="ti ti-share" aria-hidden="true"></i> Enviar mis datos
          </button>
          <p v-if="compartido" role="status" class="text-sm font-bold">{{ compartido }}</p>
        </div>
        <div class="space-y-2">
          <h3 class="text-base">Recibir datos de un archivo</h3>
          <label class="btn-ghost cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
            <i class="ti ti-upload" aria-hidden="true"></i> Elegir el archivo recibido
            <input type="file" accept=".json,application/json" class="sr-only" @change="recibir" />
          </label>
          <p v-if="recibido" role="status" class="font-bold text-ok-fg">{{ recibido }}</p>
          <p v-if="errorRecibido" role="alert" class="font-bold text-bad-fg">{{ errorRecibido }}</p>
        </div>
      </div>
      <p class="text-sm text-ink-soft">
        WhatsApp necesita algo de conexión para entregar el archivo, pero pesa muy poco. Solo se aceptan datos más
        nuevos que los que ya tienes.
      </p>
    </section>
  </div>
</template>
