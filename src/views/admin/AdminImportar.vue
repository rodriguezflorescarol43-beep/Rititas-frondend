<script setup>
import { computed, reactive, ref } from 'vue'
import { adminApi } from '../../api/admin'
import { useAsync } from '../../composables/useAsync'
import { etiquetaCampo, extraerJson, instruccionParaClaude, ultimaImportacion } from '../../admin/admin-ia'

// Importar con IA en 3 pasos: 1) pedirle los datos a Claude, 2) pegar su respuesta y el documento,
// 3) revisar con semáforo y aprobar. La IA no guarda nada: solo se guarda lo que la persona aprueba.
const MAX_BYTES = 500 * 1024
const paso = ref(1)

// Paso 1: leer con la IA integrada (Gemini) o, a mano, con Claude
const { datos: iaEstado } = useAsync(() => adminApi.estadoIa())
const archivoIa = ref(null)
const leyendo = ref(false)
const errorIa = ref('')
const esEjemplo = ref(false) // un ejemplo guardado: se puede revisar pero nunca publicar
const viaIa = ref(false) // el documento lo leyó la IA integrada (no se pegó a mano)

const copiada = ref(false)
const instruccionVisible = ref('')
const errorPaso1 = ref('')

// Paso 2
const respuesta = ref('')
const textoDocumento = ref('')
const analizando = ref(false)
const errorEntrada = ref('')

// Paso 3
const propuesta = ref(null)
const analisis = ref(null)
const aprobados = reactive({}) // indice -> true/false (siempre empieza en «no»: la persona decide)
const campos = reactive({}) // indice -> campos elegidos (solo al actualizar)
const resultado = ref(null)
const aplicando = ref(false)
const errorAplicar = ref('')

const { datos: historial, ejecutar: recargarHistorial } = useAsync(() => adminApi.registro())

const PASOS = ['Elige el documento', 'La IA lo lee', 'Revisa y aprueba']
const NOMBRE_RECURSO = {
  universidades: 'Universidad', facultades: 'Facultad', carreras: 'Carrera',
  convocatorias: 'Convocatoria', preuniversitarios: 'Preuniversitario',
}
const SEMAFORO = {
  verde: { texto: 'Listo para aprobar', clase: 'bg-ok-bg text-ok-fg', color: 'text-ok-fg', borde: '!border-l-ok-fg', icono: 'ti-circle-check' },
  amarillo: { texto: 'Míralo antes', clase: 'bg-warn-bg text-warn-fg', color: 'text-warn-fg', borde: '!border-l-warn-fg', icono: 'ti-alert-triangle' },
  rojo: { texto: 'Cuidado', clase: 'bg-bad-bg text-bad-fg', color: 'text-bad-fg', borde: '!border-l-bad-fg', icono: 'ti-circle-x' },
}
const CITA = {
  encontrada: { texto: 'Sí, está', clase: 'text-ok-fg', icono: 'ti-circle-check' },
  parecida: { texto: 'Parecida', clase: 'text-warn-fg', icono: 'ti-alert-triangle' },
  no_encontrada: { texto: 'No aparece', clase: 'text-bad-fg', icono: 'ti-circle-x' },
  sin_texto: { texto: 'Sin documento', clase: 'text-ink-soft', icono: 'ti-help-circle' },
}

function mostrar(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
const esEnlace = (t) => typeof t === 'string' && /^https?:\/\/\S+$/.test(t)

// ---------- Paso 1 ----------
// La instrucción se prepara al abrir la página: así el botón copia al instante (los navegadores solo
// dejan copiar justo después del toque).
const instruccionLista = adminApi.referencias()
  .then((ref) => { instruccionVisible.value = instruccionParaClaude(ref) })
  .catch((e) => { errorPaso1.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message })

function copiarConSeleccion(texto) {
  const area = document.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  return ok
}

async function copiarInstruccion() {
  copiada.value = false
  if (!instruccionVisible.value) await instruccionLista
  if (!instruccionVisible.value) return
  errorPaso1.value = ''
  try {
    await navigator.clipboard.writeText(instruccionVisible.value)
    copiada.value = true
  } catch {
    copiada.value = copiarConSeleccion(instruccionVisible.value)
  }
  if (!copiada.value) errorPaso1.value = 'Tu navegador no dejó copiar: abre «Ver la instrucción» y cópiala a mano.'
}

// ---------- Paso 2 ----------
async function revisar(datos, texto = textoDocumento.value) {
  errorEntrada.value = ''
  resultado.value = null
  errorAplicar.value = ''
  const conDocumento = { ...datos }
  if (texto && texto.trim()) conDocumento.texto_fuente = texto
  else delete conDocumento.texto_fuente
  analizando.value = true
  try {
    analisis.value = await adminApi.analizarPropuesta(conDocumento)
    propuesta.value = conDocumento
    ultimaImportacion.value = esEjemplo.value ? null : { propuesta: datos, texto: texto || '' }
    for (const k of Object.keys(aprobados)) delete aprobados[k]
    for (const c of analisis.value.cambios) {
      aprobados[c.indice] = false
      campos[c.indice] = c.diff.filter((d) => d.cambia).map((d) => d.campo)
    }
    paso.value = 3
  } catch (e) {
    errorEntrada.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
    if (paso.value === 1) errorIa.value = errorEntrada.value
  } finally {
    analizando.value = false
  }
}

// ---------- Paso 1: «Leer con IA» (Gemini lee el documento y propone; no guarda nada) ----------
function elegirDocumento(evento) {
  archivoIa.value = evento.target.files?.[0] ?? null
  errorIa.value = ''
}

async function leerConIa() {
  if (!archivoIa.value) return
  errorIa.value = ''
  esEjemplo.value = false
  leyendo.value = true
  try {
    const r = await adminApi.leerConIa(archivoIa.value)
    viaIa.value = true
    textoDocumento.value = r.texto_fuente || ''
    await revisar(r.propuesta, r.texto_fuente || '')
  } catch (e) {
    errorIa.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    leyendo.value = false
  }
}

async function probarEjemplo() {
  errorIa.value = ''
  leyendo.value = true
  try {
    const r = await adminApi.ejemploIa()
    esEjemplo.value = true
    viaIa.value = true
    textoDocumento.value = r.texto_fuente
    await revisar(r.propuesta, r.texto_fuente)
  } catch (e) {
    esEjemplo.value = false
    errorIa.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    leyendo.value = false
  }
}

function revisarPegado() {
  try {
    revisar(extraerJson(respuesta.value))
  } catch (e) {
    errorEntrada.value = e.message
  }
}

async function elegirArchivo(evento) {
  const archivo = evento.target.files?.[0]
  evento.target.value = ''
  if (!archivo) return
  if (archivo.size > MAX_BYTES) {
    errorEntrada.value = 'El archivo es demasiado grande para ser una propuesta (máximo 500 KB).'
    return
  }
  respuesta.value = await archivo.text()
  revisarPegado()
}

// ---------- Paso 3 ----------
const cambios = computed(() => analisis.value?.cambios ?? [])
const verdes = computed(() => cambios.value.filter((c) => c.valido && c.semaforo === 'verde'))
const lista = computed(() =>
  cambios.value
    .filter((c) => c.valido && aprobados[c.indice])
    .map((c) => ({ indice: c.indice, ...(c.accion === 'actualizar' ? { campos: campos[c.indice] ?? [] } : {}) })),
)

function marcarVerdes() {
  for (const c of cambios.value) aprobados[c.indice] = c.valido && c.semaforo === 'verde'
}

async function aplicar() {
  if (esEjemplo.value) return
  errorAplicar.value = ''
  aplicando.value = true
  try {
    resultado.value = await adminApi.aplicarPropuesta(propuesta.value, lista.value)
    await recargarHistorial()
  } catch (e) {
    errorAplicar.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    aplicando.value = false
  }
}

function empezarDeNuevo() {
  propuesta.value = null
  analisis.value = null
  resultado.value = null
  respuesta.value = ''
  textoDocumento.value = ''
  errorEntrada.value = ''
  copiada.value = false
  archivoIa.value = null
  errorIa.value = ''
  esEjemplo.value = false
  viaIa.value = false
  paso.value = 1
}

// Los avisos del servidor nombran los campos por su clave («fecha_examen»): se muestran con su nombre amigable.
const amigable = (recurso, texto) => texto.replace(/«([a-z_]+)»/g, (_, campo) => `«${etiquetaCampo(recurso, campo)}»`)

const cuando = (iso) => new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
const campoCambiado = (r) => Object.keys(r.despues ?? {}).map((c) => etiquetaCampo(r.recurso, c)).join(', ')
</script>

<template>
  <h1 class="mb-1 text-2xl">Importar con IA</h1>
  <p class="mb-5 max-w-3xl text-ink-soft">
    Una IA lee la convocatoria (PDF o foto) por ti. Esta página <strong>revisa que no haya inventado nada</strong> y
    tú decides qué se publica. Nada se guarda sin tu aprobación. La IA es solo para el administrador: los estudiantes nunca la usan.
  </p>

  <!-- Indicador de pasos -->
  <ol class="mb-6 grid grid-cols-3 gap-2" aria-label="Pasos">
    <li v-for="(nombre, i) in PASOS" :key="nombre" :aria-current="paso === i + 1 ? 'step' : undefined"
        class="rounded-xl border-2 p-2 text-center text-sm sm:p-3"
        :class="paso === i + 1 ? 'border-brand bg-brand-soft font-bold' : paso > i + 1 ? 'border-ok-fg text-ok-fg' : 'border-line text-ink-soft'">
      <span class="mx-auto mb-1 flex size-8 items-center justify-center rounded-full text-base font-bold"
            :class="paso > i + 1 ? 'bg-ok-fg text-white' : paso === i + 1 ? 'bg-brand text-white' : 'bg-line'">
        <i v-if="paso > i + 1" class="ti ti-check" aria-hidden="true"></i><template v-else>{{ i + 1 }}</template>
      </span>
      {{ nombre }}
    </li>
  </ol>

  <!-- PASO 1 -->
  <section v-if="paso === 1" class="card space-y-5" aria-labelledby="p1">
    <h2 id="p1" class="text-xl">Paso 1 · Elige el documento</h2>

    <!-- La IA integrada lee el documento aquí mismo: no hace falta abrir otra ventana ni tener cuenta de Claude. -->
    <div v-if="iaEstado?.disponible" class="space-y-3 rounded-xl bg-brand-soft p-4">
      <p class="text-lg font-bold"><i class="ti ti-cpu text-brand" aria-hidden="true"></i> Leer con IA <span class="text-sm font-normal text-ink-soft">({{ iaEstado.modelo }})</span></p>
      <p class="text-sm">
        Sube la convocatoria (PDF o foto). La IA propone los datos con la frase donde los leyó, y esta página comprueba
        que cada frase exista. <strong>Nada se publica sin tu aprobación.</strong>
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <label class="btn-ghost cursor-pointer bg-card has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
          <i class="ti ti-upload" aria-hidden="true"></i>
          <span class="max-w-56 truncate">{{ archivoIa ? archivoIa.name : 'Elegir PDF o foto' }}</span>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" class="sr-only" @change="elegirDocumento" />
        </label>
        <button type="button" class="btn-primary" :disabled="!archivoIa || leyendo" :aria-busy="leyendo" @click="leerConIa">
          <i class="ti" :class="leyendo ? 'ti-loader-2 animate-spin' : 'ti-cpu'" aria-hidden="true"></i>
          {{ leyendo ? 'Leyendo…' : 'Leer con IA' }}
        </button>
      </div>
      <p v-if="leyendo" role="status" class="font-bold">La IA está leyendo el documento… puede tardar hasta un minuto.</p>
      <p class="text-xs text-ink-soft">Sube solo documentos públicos. Con el nivel gratis, Google puede usar lo que envíes para mejorar sus productos.</p>
    </div>
    <p v-else-if="iaEstado" class="rounded-xl bg-off-bg p-3 text-sm">
      <i class="ti ti-info-circle" aria-hidden="true"></i>
      «Leer con IA» no está activado (falta la clave en el servidor). Puedes probar el ejemplo o usar Claude a mano.
    </p>
    <p v-if="errorIa" role="alert" class="font-bold text-bad-fg">{{ errorIa }}</p>

    <div class="space-y-1">
      <button type="button" class="btn-ghost" :disabled="leyendo" @click="probarEjemplo">
        <i class="ti ti-file-import" aria-hidden="true"></i> Probar con un documento de ejemplo
      </button>
      <p class="text-sm text-ink-soft">Una respuesta de IA guardada sobre un documento ficticio, con un error a propósito. Sirve para ver el semáforo; no se puede publicar.</p>
    </div>

    <details class="rounded-xl border-2 border-line p-3">
      <summary class="cursor-pointer font-bold">Sin la IA integrada: usar Claude a mano</summary>
      <div class="mt-3 space-y-4">
      <ol class="list-decimal space-y-2 pl-6">
        <li>Toca <strong>«Copiar instrucción»</strong>. Ya incluye las reglas y la lista de universidades de tu página.</li>
        <li>Abre Claude, <strong>adjunta el PDF o la foto</strong> de la convocatoria y <strong>pega</strong> la instrucción.</li>
        <li>Cuando Claude responda, <strong>copia toda su respuesta</strong> y vuelve aquí.</li>
      </ol>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="btn-primary" @click="copiarInstruccion">
          <i class="ti" :class="copiada ? 'ti-check' : 'ti-copy'" aria-hidden="true"></i>
          {{ copiada ? '¡Copiada!' : 'Copiar instrucción' }}
        </button>
        <a href="https://claude.ai/new" target="_blank" rel="noopener" class="btn-ghost">
          <i class="ti ti-external-link" aria-hidden="true"></i> Abrir Claude
        </a>
      </div>
      <p v-if="copiada" role="status" class="font-bold text-ok-fg">Listo: ahora pégala en Claude junto con el documento.</p>
      <p v-if="errorPaso1" role="alert" class="font-bold text-bad-fg">{{ errorPaso1 }}</p>
      <details v-if="instruccionVisible" class="text-sm">
        <summary class="cursor-pointer font-bold">Ver la instrucción</summary>
        <textarea readonly rows="8" class="field mt-2 font-mono text-xs" :value="instruccionVisible" aria-label="Instrucción para Claude"></textarea>
      </details>
      <div class="border-t-2 border-line pt-4">
        <button type="button" class="btn-primary" @click="paso = 2">
          Ya tengo la respuesta de Claude <i class="ti ti-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
      </div>
    </details>
  </section>

  <!-- PASO 2 -->
  <section v-else-if="paso === 2" class="card space-y-5" aria-labelledby="p2">
    <h2 id="p2" class="text-xl">Paso 2 · Pega la respuesta y el documento</h2>

    <div>
      <label for="respuesta" class="mb-1 block text-lg font-bold">
        <span class="mr-1 inline-flex size-7 items-center justify-center rounded-full bg-brand text-sm text-white">A</span>
        La respuesta de Claude
      </label>
      <p class="mb-2 text-sm text-ink-soft">Pégala completa, aunque traiga texto antes o después: aquí se toma solo lo necesario.</p>
      <textarea id="respuesta" v-model="respuesta" rows="6" class="field font-mono text-sm" placeholder="Pega aquí la respuesta de Claude"></textarea>
    </div>

    <div>
      <label for="documento" class="mb-1 block text-lg font-bold">
        <span class="mr-1 inline-flex size-7 items-center justify-center rounded-full bg-brand text-sm text-white">B</span>
        El texto del documento oficial <span class="text-sm font-normal text-ink-soft">(muy recomendado)</span>
      </label>
      <p class="mb-2 text-sm text-ink-soft">
        Abre el PDF, selecciona todo (<kbd>Ctrl</kbd>+<kbd>A</kbd>), copia (<kbd>Ctrl</kbd>+<kbd>C</kbd>) y pégalo aquí.
        Con esto se revisa que <strong>cada frase que citó Claude exista de verdad</strong> en el documento.
        Si es una foto, puedes dejarlo vacío, pero las citas no se podrán revisar.
      </p>
      <textarea id="documento" v-model="textoDocumento" rows="6" class="field text-sm" placeholder="Pega aquí el texto de la convocatoria"></textarea>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="btn-ghost" @click="paso = 1"><i class="ti ti-arrow-left" aria-hidden="true"></i> Volver</button>
      <button type="button" class="btn-primary" :disabled="!respuesta.trim() || analizando" :aria-busy="analizando" @click="revisarPegado">
        <i class="ti" :class="analizando ? 'ti-loader-2 animate-spin' : 'ti-shield-check'" aria-hidden="true"></i>
        {{ analizando ? 'Revisando…' : 'Revisar ahora' }}
      </button>
      <label class="cursor-pointer text-sm font-bold text-brand underline has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
        o sube un archivo .json
        <input type="file" accept=".json,application/json" class="sr-only" @change="elegirArchivo" />
      </label>
    </div>
    <p v-if="errorEntrada" role="alert" class="font-bold text-bad-fg">{{ errorEntrada }}</p>
  </section>

  <!-- PASO 3 -->
  <section v-else aria-labelledby="p3">
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="p3" class="text-xl">Paso 3 · Revisa y aprueba</h2>
        <p class="text-sm text-ink-soft">
          Fuente:
          <a v-if="esEnlace(analisis.fuente)" :href="analisis.fuente" target="_blank" rel="noopener" class="font-bold text-brand underline">{{ analisis.fuente }}</a>
          <strong v-else>{{ analisis.fuente || 'no indicada' }}</strong>
          <span v-if="analisis.origen"> · lo propuso: {{ analisis.origen }}</span>
        </p>
      </div>
      <button type="button" class="btn-ghost !min-h-10 !px-4 !py-1.5 text-sm" @click="viaIa ? empezarDeNuevo() : (paso = 2)">
        <i class="ti ti-arrow-left" aria-hidden="true"></i> {{ viaIa ? 'Elegir otro documento' : 'Cambiar lo pegado' }}
      </button>
    </div>

    <p v-if="esEjemplo" role="status" class="card mb-4 !border-warn-fg bg-warn-bg font-bold text-warn-fg">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i>
      Esto es un ejemplo con un documento ficticio: sirve para ver el semáforo. No se puede publicar.
    </p>
    <p v-else-if="analisis.origen" class="mb-3 text-sm">
      <span class="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-0.5 font-bold text-brand"><i class="ti ti-cpu" aria-hidden="true"></i> Leído por IA</span>
      Los datos los propuso <strong>{{ analisis.origen }}</strong>. Una IA puede equivocarse: revisa antes de publicar.
    </p>

    <!-- Resumen con semáforo -->
    <div class="card mb-4 space-y-3">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div v-for="color in ['verde', 'amarillo', 'rojo']" :key="color" class="rounded-xl p-2" :class="SEMAFORO[color].clase">
          <p class="text-2xl font-bold">{{ analisis.semaforo[color] }}</p>
          <p class="text-sm font-bold"><i class="ti" :class="SEMAFORO[color].icono" aria-hidden="true"></i> {{ SEMAFORO[color].texto }}</p>
        </div>
      </div>
      <p v-if="analisis.citas.con_texto" class="text-sm">
        <i class="ti ti-shield-check text-brand" aria-hidden="true"></i>
        Revisé las frases contra el documento:
        <strong class="text-ok-fg">{{ analisis.citas.encontradas }} {{ analisis.citas.encontradas === 1 ? 'está' : 'están' }}</strong>,
        <strong class="text-warn-fg">{{ analisis.citas.parecidas }} {{ analisis.citas.parecidas === 1 ? 'parecida' : 'parecidas' }}</strong> y
        <strong class="text-bad-fg">{{ analisis.citas.no_encontradas }} {{ analisis.citas.no_encontradas === 1 ? 'no aparece' : 'no aparecen' }}</strong>.
      </p>
      <p v-else class="text-sm font-bold text-warn-fg">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        {{ viaIa ? 'El documento es una foto (sin texto): no se puede comprobar si las frases son reales. Revisa cada dato con el documento a la vista.' : 'No pegaste el texto del documento: no se pudo revisar si las frases son reales.' }}
        <button v-if="!viaIa" type="button" class="underline" @click="paso = 2">Pegarlo ahora</button>
      </p>
    </div>

    <div v-if="resultado" role="status" class="card mb-4 border-ok-fg bg-ok-bg text-ok-fg">
      <p class="font-bold">
        <i class="ti ti-circle-check" aria-hidden="true"></i>
        {{ resultado.aplicados.length === 1 ? 'Se publicó 1 cambio.' : `Se publicaron ${resultado.aplicados.length} cambios.` }}
        La página de los estudiantes ya lo muestra.
      </p>
      <span v-for="o in resultado.omitidos" :key="o.indice" class="mt-1 block font-bold text-warn-fg">No se aplicó el cambio {{ o.indice + 1 }}: {{ o.motivo }}</span>
      <div class="mt-3 flex flex-wrap gap-3">
        <button type="button" class="btn-primary" @click="empezarDeNuevo">Importar otro documento</button>
        <RouterLink to="/admin/medir" class="btn-ghost bg-card">
          <i class="ti ti-chart-bar" aria-hidden="true"></i> Medir qué tan bien lo hizo la IA
        </RouterLink>
      </div>
    </div>

    <ul class="space-y-4">
      <li v-for="c in cambios" :key="c.indice" class="card space-y-3 !border-l-8" :class="[SEMAFORO[c.semaforo].borde, aprobados[c.indice] ? 'ring-2 ring-brand' : '']">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-sm font-bold text-ink-soft">
              {{ c.accion === 'crear' ? 'Nuevo' : 'Actualizar' }} · {{ NOMBRE_RECURSO[c.recurso] }}
              <span class="ml-1 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-brand"><i class="ti ti-cpu" aria-hidden="true"></i> Leído por IA</span>
            </p>
            <h3 class="text-lg">{{ c.titulo }}</h3>
          </div>
          <span class="rounded-full px-3 py-1 text-sm font-bold" :class="SEMAFORO[c.semaforo].clase">
            <i class="ti" :class="SEMAFORO[c.semaforo].icono" aria-hidden="true"></i> {{ SEMAFORO[c.semaforo].texto }}
          </span>
        </div>
        <p class="font-bold" :class="SEMAFORO[c.semaforo].color">{{ amigable(c.recurso, c.motivo) }}</p>

        <ul v-if="c.errores.length" role="alert" class="list-disc space-y-0.5 pl-5 font-bold text-bad-fg">
          <li v-for="e in c.errores" :key="e">{{ amigable(c.recurso, e) }}</li>
        </ul>
        <details v-if="c.advertencias.length" class="text-sm">
          <summary class="cursor-pointer font-bold text-warn-fg">Ver {{ c.advertencias.length }} {{ c.advertencias.length === 1 ? 'aviso' : 'avisos' }}</summary>
          <ul class="mt-1 list-disc space-y-0.5 pl-5 text-warn-fg">
            <li v-for="a in c.advertencias" :key="a">{{ amigable(c.recurso, a) }}</li>
          </ul>
        </details>

        <div v-if="c.diff.length" class="overflow-x-auto rounded-xl border-2 border-line">
          <table class="w-full text-left text-sm">
            <caption class="sr-only">Qué cambia en {{ c.titulo }}</caption>
            <thead class="bg-brand-soft">
              <tr>
                <th v-if="c.accion === 'actualizar'" scope="col" class="w-10 px-3 py-2"><span class="sr-only">Aceptar este dato</span></th>
                <th scope="col" class="px-3 py-2">Dato</th>
                <th v-if="c.accion === 'actualizar'" scope="col" class="px-3 py-2">Ahora</th>
                <th scope="col" class="px-3 py-2">Propuesto</th>
                <th scope="col" class="px-3 py-2">Frase del documento</th>
                <th scope="col" class="px-3 py-2">¿Está en el documento?</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in c.diff.filter((x) => !x.campo.endsWith('_id'))" :key="d.campo" class="border-t-2 border-line align-top" :class="d.cambia ? '' : 'text-ink-soft'">
                <td v-if="c.accion === 'actualizar'" class="px-3 py-2">
                  <input v-model="campos[c.indice]" type="checkbox" class="size-5 accent-brand" :value="d.campo" :disabled="!d.cambia || !c.valido" :aria-label="`Aceptar ${etiquetaCampo(c.recurso, d.campo)}`" />
                </td>
                <td class="px-3 py-2 font-bold">{{ etiquetaCampo(c.recurso, d.campo) }}</td>
                <td v-if="c.accion === 'actualizar'" class="px-3 py-2">{{ mostrar(d.antes) }}</td>
                <td class="px-3 py-2 font-bold">{{ mostrar(d.despues) }}<span v-if="!d.cambia" class="font-normal"> (igual)</span></td>
                <td class="px-3 py-2 italic">{{ d.evidencia ? `«${d.evidencia}»` : 'Claude no dio la frase' }}</td>
                <td class="px-3 py-2 font-bold">
                  <span v-if="d.cita" :class="CITA[d.cita].clase"><i class="ti" :class="CITA[d.cita].icono" aria-hidden="true"></i> {{ CITA[d.cita].texto }}</span>
                  <span v-else class="text-warn-fg"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Sin frase</span>
                  <span v-if="d.valor_coincide === false" class="mt-1 block text-bad-fg">El valor no coincide con la frase</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <label class="flex items-center gap-3 rounded-xl p-1" :class="c.valido && !esEjemplo ? 'cursor-pointer' : 'opacity-60'">
          <input v-model="aprobados[c.indice]" type="checkbox" class="size-6 accent-brand" :disabled="!c.valido || esEjemplo" />
          <span class="font-bold">{{ esEjemplo ? 'Ejemplo: no se puede publicar' : c.valido ? 'Aprobar y publicar este cambio' : 'No se puede aprobar: tiene errores' }}</span>
        </label>
      </li>
    </ul>

    <div class="sticky bottom-0 mt-5 flex flex-wrap items-center gap-3 border-t-2 border-line bg-paper py-3">
      <button type="button" class="btn-ghost" :disabled="!verdes.length || esEjemplo" @click="marcarVerdes">
        <i class="ti ti-circle-check" aria-hidden="true"></i> {{ verdes.length === 1 ? 'Marcar el verde' : `Marcar los ${verdes.length} verdes` }}
      </button>
      <button type="button" class="btn-primary" :disabled="!lista.length || aplicando || esEjemplo" :aria-busy="aplicando" @click="aplicar">
        {{ aplicando ? 'Publicando…' : `Publicar ${lista.length} ${lista.length === 1 ? 'cambio' : 'cambios'}` }}
      </button>
      <span v-if="esEjemplo" class="text-sm font-bold text-warn-fg">Es un ejemplo.</span>
      <button v-if="esEjemplo" type="button" class="btn-primary" @click="empezarDeNuevo">Probar con mi documento</button>
      <span v-else-if="!lista.length" class="text-sm text-ink-soft">Marca lo que quieres publicar.</span>
    </div>
    <p class="mt-1 text-sm text-ink-soft">
      Al publicar, cada dato queda con la <strong>fecha de hoy como verificado</strong> y en el historial queda de qué fuente y con qué frase salió.
    </p>
    <p v-if="errorAplicar" role="alert" class="mt-2 font-bold text-bad-fg">{{ errorAplicar }}</p>
  </section>

  <section class="mt-10" aria-labelledby="i-historial">
    <h2 id="i-historial" class="mb-2 text-lg">Historial de lo publicado con IA</h2>
    <p v-if="!historial?.length" class="card text-ink-soft">Todavía no se publicó nada desde aquí.</p>
    <ul v-else class="space-y-2">
      <li v-for="r in historial.slice(0, 12)" :key="r.id" class="card !p-3">
        <p class="font-bold">
          {{ r.accion === 'crear' ? 'Creó' : 'Actualizó' }} · {{ NOMBRE_RECURSO[r.recurso] ?? r.recurso }} #{{ r.fila_id }}
          <span class="font-normal text-ink-soft">· {{ cuando(r.creado_en) }}</span>
        </p>
        <p class="text-sm text-ink-soft">
          Datos: {{ campoCambiado(r) }} · Fuente:
          <a v-if="esEnlace(r.fuente)" :href="r.fuente" target="_blank" rel="noopener" class="font-bold text-brand underline">{{ r.fuente }}</a>
          <span v-else>{{ r.fuente || 'no indicada' }}</span>
        </p>
      </li>
    </ul>
  </section>
</template>
