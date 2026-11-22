<script setup>
import { computed, reactive, ref } from 'vue'
import { adminApi } from '../../api/admin'
import { useAsync } from '../../composables/useAsync'
import { camposDe, etiquetaCampo, extraerJson, ultimaImportacion } from '../../admin/admin-ia'

// Medir la IA: la persona marca, dato por dato, si lo que propuso la IA es correcto. Con eso se calcula
// cuánto acierta, cuánto inventa, cuántos errores atrapa el verificador y cómo le va a un método sin IA.
const { datos: guardadas, ejecutar: recargar } = useAsync(() => adminApi.mediciones())

const documento = ref('')
const texto = ref('')
const respuestaIa = ref('')
const propuesta = ref(null)
const revision = ref([]) // un elemento por cambio: { recurso, ..., filas: [{ campo, valorIa, estado, corregido }], agregados }
const nuevo = reactive({}) // indice -> { campo, valor } para agregar un dato que la IA no encontró
const error = ref('')
const calculando = ref(false)
const resultado = ref(null)

const NOMBRE_RECURSO = {
  universidades: 'Universidad', facultades: 'Facultad', carreras: 'Carrera',
  convocatorias: 'Convocatoria', preuniversitarios: 'Preuniversitario',
}
const ESTADOS = [
  { valor: 'bien', texto: 'Correcto', icono: 'ti-circle-check', clase: 'peer-checked:bg-ok-bg peer-checked:text-ok-fg peer-checked:border-ok-fg' },
  { valor: 'mal', texto: 'Está mal', icono: 'ti-pencil', clase: 'peer-checked:bg-warn-bg peer-checked:text-warn-fg peer-checked:border-warn-fg' },
  { valor: 'no_esta', texto: 'No está en el documento', icono: 'ti-circle-x', clase: 'peer-checked:bg-bad-bg peer-checked:text-bad-fg peer-checked:border-bad-fg' },
]

const pct = (x) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`)
const mostrar = (v) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const cuando = (iso) => new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })

function usarUltima() {
  const u = ultimaImportacion.value
  respuestaIa.value = JSON.stringify(u.propuesta, null, 2)
  texto.value = u.texto || ''
  documento.value = u.propuesta.fuente || ''
  cargar()
}

function cargar() {
  error.value = ''
  resultado.value = null
  try {
    const p = extraerJson(respuestaIa.value)
    if (!Array.isArray(p.cambios) || !p.cambios.length) throw new Error('La propuesta no trae cambios.')
    propuesta.value = p
    if (!documento.value) documento.value = p.fuente || ''
    revision.value = p.cambios.map((c) => ({
      recurso: c.recurso, accion: c.accion, id: c.id, referencias: c.referencias,
      titulo: c.datos?.nombre || c.datos?.titulo || NOMBRE_RECURSO[c.recurso] || 'Cambio',
      internos: Object.fromEntries(Object.entries(c.datos ?? {}).filter(([k]) => k.endsWith('_id'))),
      filas: Object.entries(c.datos ?? {}).filter(([k]) => !k.endsWith('_id'))
        .map(([campo, valorIa]) => ({ campo, valorIa, estado: null, corregido: '' })),
      agregados: [],
    }))
    revision.value.forEach((_, i) => { nuevo[i] = { campo: '', valor: '' } })
  } catch (e) {
    propuesta.value = null
    revision.value = []
    error.value = e.message
  }
}

const faltan = computed(() => revision.value.reduce((n, c) => n + c.filas.filter((f) => !f.estado).length, 0))
const total = computed(() => revision.value.reduce((n, c) => n + c.filas.length, 0))
const faltaCorregir = computed(() => revision.value.some((c) => c.filas.some((f) => f.estado === 'mal' && !String(f.corregido).trim())))

function camposParaAgregar(c) {
  const usados = new Set([...c.filas.map((f) => f.campo), ...c.agregados.map((a) => a.campo)])
  return camposDe(c.recurso).filter((x) => !usados.has(x.clave))
}

function agregar(i) {
  const n = nuevo[i]
  if (!n.campo || !String(n.valor).trim()) return
  revision.value[i].agregados.push({ campo: n.campo, valor: n.valor })
  nuevo[i] = { campo: '', valor: '' }
}

// Fechas con calendario y números con teclado numérico: así nadie tiene que escribir «AAAA-MM-DD».
function tipoInput(recurso, campo) {
  const tipo = camposDe(recurso).find((x) => x.clave === campo)?.tipo
  return tipo === 'fecha' ? 'date' : tipo === 'numero' ? 'number' : 'text'
}

function convertir(recurso, campo, valor, ejemplo) {
  const tipo = camposDe(recurso).find((x) => x.clave === campo)?.tipo
  const limpio = String(valor).trim()
  if (typeof ejemplo === 'number' || tipo === 'numero') return Number(limpio.replace(',', '.'))
  return limpio
}

// La «verdad» se arma con las respuestas de la persona, en el mismo orden que la propuesta.
function verdad() {
  return {
    formato: 1,
    cambios: revision.value.map((c) => {
      const datos = { ...c.internos }
      for (const f of c.filas) {
        if (f.estado === 'bien') datos[f.campo] = f.valorIa
        if (f.estado === 'mal') datos[f.campo] = convertir(c.recurso, f.campo, f.corregido, f.valorIa)
      }
      for (const a of c.agregados) datos[a.campo] = convertir(c.recurso, a.campo, a.valor)
      return { accion: c.accion, recurso: c.recurso, id: c.id, referencias: c.referencias, datos }
    }),
  }
}

async function calcular() {
  error.value = ''
  calculando.value = true
  try {
    resultado.value = await adminApi.medirIa({
      documento: documento.value, texto_fuente: texto.value || null, propuesta: propuesta.value, verdad: verdad(),
    })
    await recargar()
  } catch (e) {
    error.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    calculando.value = false
  }
}

function otra() {
  resultado.value = null
  propuesta.value = null
  revision.value = []
  respuestaIa.value = ''
  texto.value = ''
  documento.value = ''
}
</script>

<template>
  <h1 class="mb-1 text-2xl">Medir la IA</h1>
  <p class="mb-5 max-w-3xl text-ink-soft">
    No basta con usar IA: hay que saber <strong>cuánto se equivoca</strong>. Aquí comparas lo que propuso Claude con lo
    que de verdad dice el documento. Se mide cuánto acierta, cuánto inventa, cuántos errores atrapa el verificador de
    frases y cómo le va a un método <strong>sin IA</strong> con el mismo documento.
  </p>

  <!-- Resultado acumulado -->
  <section v-if="guardadas?.total" class="card mb-6 space-y-3" aria-labelledby="m-total">
    <h2 id="m-total" class="text-lg">
      Resultado acumulado · {{ guardadas.total.documentos }} {{ guardadas.total.documentos === 1 ? 'documento medido' : 'documentos medidos' }}
    </h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl bg-ok-bg p-3 text-ok-fg">
        <p class="text-3xl font-bold">{{ pct(guardadas.total.ia_precision) }}</p>
        <p class="text-sm font-bold">de lo que propuso la IA estaba bien</p>
      </div>
      <div class="rounded-xl bg-brand-soft p-3">
        <p class="text-3xl font-bold">{{ pct(guardadas.total.ia_cobertura) }}</p>
        <p class="text-sm font-bold">de los datos del documento encontró</p>
      </div>
      <div class="rounded-xl bg-bad-bg p-3 text-bad-fg">
        <p class="text-3xl font-bold">{{ guardadas.total.ia_inventados ?? '—' }}</p>
        <p class="text-sm font-bold">datos inventados</p>
      </div>
      <div class="rounded-xl bg-warn-bg p-3 text-warn-fg">
        <p class="text-3xl font-bold">{{ guardadas.total.errores == null ? '—' : `${guardadas.total.detectados} de ${guardadas.total.errores}` }}</p>
        <p class="text-sm font-bold">errores atrapados por el verificador</p>
      </div>
    </div>
    <p class="text-sm text-ink-soft">
      Sin IA (solo reglas), con los mismos documentos, se encontró el <strong>{{ pct(guardadas.total.reglas_cobertura) }}</strong> de los datos.
      <template v-if="guardadas.total.falsas_alarmas != null"> El verificador dio {{ guardadas.total.falsas_alarmas }} {{ guardadas.total.falsas_alarmas === 1 ? 'falsa alarma' : 'falsas alarmas' }} (marcó un dato que estaba bien).</template>
    </p>
  </section>

  <!-- Resultado de la medición recién hecha -->
  <section v-if="resultado" role="status" class="card mb-6 space-y-3 !border-brand" aria-labelledby="m-res">
    <h2 id="m-res" class="text-lg"><i class="ti ti-chart-bar text-brand" aria-hidden="true"></i> Resultado: {{ resultado.documento }}</h2>
    <div class="overflow-x-auto rounded-xl border-2 border-line">
      <table class="w-full text-left text-sm">
        <thead class="bg-brand-soft">
          <tr><td class="px-3 py-2"></td><th scope="col" class="px-3 py-2">Con IA ({{ resultado.origen || 'IA' }})</th><th scope="col" class="px-3 py-2">Sin IA (reglas)</th></tr>
        </thead>
        <tbody>
          <tr class="border-t-2 border-line"><th scope="row" class="px-3 py-2">De lo que propuso, estaba bien</th><td class="px-3 py-2 font-bold">{{ pct(resultado.ia.precision) }}</td><td class="px-3 py-2">{{ resultado.reglas ? pct(resultado.reglas.precision) : '—' }}</td></tr>
          <tr class="border-t-2 border-line"><th scope="row" class="px-3 py-2">Datos del documento que encontró</th><td class="px-3 py-2 font-bold">{{ resultado.ia.correctos }} de {{ resultado.ia.esperados }} ({{ pct(resultado.ia.cobertura) }})</td><td class="px-3 py-2">{{ resultado.reglas ? `${resultado.reglas.correctos} de ${resultado.reglas.esperados} (${pct(resultado.reglas.cobertura)})` : '—' }}</td></tr>
          <tr class="border-t-2 border-line"><th scope="row" class="px-3 py-2">Datos equivocados</th><td class="px-3 py-2 font-bold">{{ resultado.ia.incorrectos }}</td><td class="px-3 py-2">{{ resultado.reglas?.incorrectos ?? '—' }}</td></tr>
          <tr class="border-t-2 border-line"><th scope="row" class="px-3 py-2">Datos inventados</th><td class="px-3 py-2 font-bold">{{ resultado.ia.inventados }}</td><td class="px-3 py-2">{{ resultado.reglas?.inventados ?? '—' }}</td></tr>
        </tbody>
      </table>
    </div>
    <p v-if="resultado.verificador" class="font-bold">
      <i class="ti ti-shield-check text-brand" aria-hidden="true"></i>
      El verificador de frases atrapó {{ resultado.verificador.detectados }} de {{ resultado.verificador.errores }} errores de la IA
      y dio {{ resultado.verificador.falsas_alarmas }} {{ resultado.verificador.falsas_alarmas === 1 ? 'falsa alarma' : 'falsas alarmas' }}.
    </p>
    <p v-else class="text-sm text-warn-fg">Sin el texto del documento no se pudo medir el verificador ni comparar con el método sin IA.</p>
    <button type="button" class="btn-primary" @click="otra">Medir otro documento</button>
  </section>

  <template v-if="!resultado">
    <!-- 1. Documento y propuesta -->
    <section class="card mb-4 space-y-4" aria-labelledby="m-1">
      <h2 id="m-1" class="text-xl">1 · El documento y lo que propuso la IA</h2>
      <div v-if="ultimaImportacion" class="flex flex-wrap items-center gap-3 rounded-xl bg-brand-soft p-3">
        <span class="font-bold">Acabas de importar una propuesta.</span>
        <button type="button" class="btn-primary !min-h-10 !py-1.5" @click="usarUltima">Medir esa propuesta</button>
      </div>
      <div>
        <label for="m-doc" class="mb-1 block font-bold">Nombre o enlace del documento</label>
        <input id="m-doc" v-model="documento" class="field" placeholder="Ej.: Convocatoria Medicina UMSS 2027" />
      </div>
      <div>
        <label for="m-texto" class="mb-1 block font-bold">Texto del documento <span class="font-normal text-ink-soft">(para medir el verificador y el método sin IA)</span></label>
        <textarea id="m-texto" v-model="texto" rows="4" class="field text-sm" placeholder="Pega aquí el texto del PDF"></textarea>
      </div>
      <div>
        <label for="m-ia" class="mb-1 block font-bold">Respuesta de la IA</label>
        <textarea id="m-ia" v-model="respuestaIa" rows="4" class="field font-mono text-sm" placeholder="Pega aquí la respuesta de Claude"></textarea>
      </div>
      <button type="button" class="btn-primary" :disabled="!respuestaIa.trim()" @click="cargar">
        Revisar dato por dato <i class="ti ti-arrow-right" aria-hidden="true"></i>
      </button>
      <p v-if="error && !propuesta" role="alert" class="font-bold text-bad-fg">{{ error }}</p>
    </section>

    <!-- 2. Revisión dato por dato -->
    <section v-if="propuesta" class="space-y-4" aria-labelledby="m-2">
      <div>
        <h2 id="m-2" class="text-xl">2 · Con el documento a la vista, marca cada dato</h2>
        <p class="text-ink-soft">Si un dato está mal, escribe el correcto. Si la IA no encontró algo que sí está en el documento, agrégalo abajo.</p>
      </div>

      <article v-for="(c, i) in revision" :key="i" class="card space-y-3">
        <p class="text-sm font-bold text-ink-soft">{{ NOMBRE_RECURSO[c.recurso] ?? c.recurso }}</p>
        <h3 class="text-lg">{{ c.titulo }}</h3>

        <fieldset v-for="f in c.filas" :key="f.campo" class="space-y-2 border-t-2 border-line pt-3">
          <legend class="sr-only">{{ etiquetaCampo(c.recurso, f.campo) }}</legend>
          <p><span class="font-bold">{{ etiquetaCampo(c.recurso, f.campo) }}:</span> {{ mostrar(f.valorIa) }}</p>
          <div class="flex flex-wrap gap-2">
            <label v-for="e in ESTADOS" :key="e.valor" class="cursor-pointer">
              <input v-model="f.estado" type="radio" :name="`f-${i}-${f.campo}`" :value="e.valor" class="peer sr-only" />
              <span class="inline-flex min-h-10 items-center gap-1 rounded-xl border-2 border-line px-3 text-sm font-bold peer-focus-visible:outline peer-focus-visible:outline-2" :class="e.clase">
                <i class="ti" :class="e.icono" aria-hidden="true"></i> {{ e.texto }}
              </span>
            </label>
          </div>
          <div v-if="f.estado === 'mal'">
            <label :for="`c-${i}-${f.campo}`" class="mb-1 block text-sm font-bold">¿Qué dice el documento?</label>
            <input :id="`c-${i}-${f.campo}`" v-model="f.corregido" :type="tipoInput(c.recurso, f.campo)" class="field" placeholder="El valor correcto" />
          </div>
        </fieldset>

        <div class="space-y-2 border-t-2 border-line pt-3">
          <p class="font-bold">¿La IA no encontró algún dato que sí está en el documento?</p>
          <ul v-if="c.agregados.length" class="list-disc pl-5 text-sm">
            <li v-for="(a, k) in c.agregados" :key="a.campo">
              {{ etiquetaCampo(c.recurso, a.campo) }}: <strong>{{ a.valor }}</strong>
              <button type="button" class="ml-2 text-bad-fg underline" @click="c.agregados.splice(k, 1)">quitar</button>
            </li>
          </ul>
          <div class="flex flex-wrap gap-2">
            <select v-model="nuevo[i].campo" class="field !w-auto" :aria-label="`Dato que faltó en ${c.titulo}`">
              <option value="">Elige el dato…</option>
              <option v-for="x in camposParaAgregar(c)" :key="x.clave" :value="x.clave">{{ x.etiqueta }}</option>
            </select>
            <input v-model="nuevo[i].valor" :type="tipoInput(c.recurso, nuevo[i].campo)" class="field !w-auto grow" placeholder="Lo que dice el documento" :aria-label="`Valor del dato que faltó en ${c.titulo}`" />
            <button type="button" class="btn-ghost !min-h-10 !py-1.5" :disabled="!nuevo[i].campo || !String(nuevo[i].valor).trim()" @click="agregar(i)">
              <i class="ti ti-plus" aria-hidden="true"></i> Agregar
            </button>
          </div>
        </div>
      </article>

      <div class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t-2 border-line bg-paper py-3">
        <button type="button" class="btn-primary" :disabled="faltan > 0 || faltaCorregir || !documento.trim() || calculando" :aria-busy="calculando" @click="calcular">
          <i class="ti" :class="calculando ? 'ti-loader-2 animate-spin' : 'ti-chart-bar'" aria-hidden="true"></i>
          {{ calculando ? 'Calculando…' : 'Calcular resultado' }}
        </button>
        <span class="text-sm font-bold" :class="faltan ? 'text-warn-fg' : 'text-ok-fg'">
          {{ faltan ? `Faltan ${faltan} de ${total} datos por marcar` : 'Todos los datos marcados' }}
        </span>
        <span v-if="faltaCorregir" class="text-sm font-bold text-warn-fg">Escribe el valor correcto de los que están mal.</span>
        <span v-if="!documento.trim()" class="text-sm font-bold text-warn-fg">Falta el nombre del documento.</span>
      </div>
      <p v-if="error" role="alert" class="font-bold text-bad-fg">{{ error }}</p>
    </section>
  </template>

  <!-- Historial -->
  <section class="mt-10" aria-labelledby="m-hist">
    <h2 id="m-hist" class="mb-2 text-lg">Mediciones guardadas</h2>
    <p v-if="!guardadas?.mediciones?.length" class="card text-ink-soft">Todavía no mediste ningún documento.</p>
    <div v-else class="overflow-x-auto rounded-xl border-2 border-line bg-card">
      <table class="w-full text-left text-sm">
        <thead class="bg-brand-soft">
          <tr>
            <th scope="col" class="px-3 py-2">Documento</th>
            <th scope="col" class="px-3 py-2">IA: bien</th>
            <th scope="col" class="px-3 py-2">IA: encontró</th>
            <th scope="col" class="px-3 py-2">Inventó</th>
            <th scope="col" class="px-3 py-2">Sin IA: encontró</th>
            <th scope="col" class="px-3 py-2">Verificador</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in guardadas.mediciones" :key="m.id" class="border-t-2 border-line">
            <td class="px-3 py-2"><strong>{{ m.documento }}</strong><br /><span class="text-ink-soft">{{ m.origen || 'IA' }} · {{ cuando(m.creado_en) }}</span></td>
            <td class="px-3 py-2 font-bold">{{ pct(m.ia.precision) }}</td>
            <td class="px-3 py-2">{{ pct(m.ia.cobertura) }}</td>
            <td class="px-3 py-2">{{ m.ia.inventados }}</td>
            <td class="px-3 py-2">{{ m.reglas ? pct(m.reglas.cobertura) : '—' }}</td>
            <td class="px-3 py-2">{{ m.verificador ? `${m.verificador.detectados} de ${m.verificador.errores}` : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
