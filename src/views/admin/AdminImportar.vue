<script setup>
import { computed, reactive, ref } from 'vue'
import { adminApi } from '../../api/admin'
import { useAsync } from '../../composables/useAsync'
import { fecha } from '../../utils/format'

const MAX_BYTES = 500 * 1024
const textoPegado = ref('')
const propuesta = ref(null)
const analisis = ref(null)
const analizando = ref(false)
const errorEntrada = ref('')
const aprobados = reactive({}) // indice -> true/false (siempre empieza en «no»: la persona decide)
const campos = reactive({}) // indice -> campos elegidos (solo al actualizar)
const resultado = ref(null)
const aplicando = ref(false)
const errorAplicar = ref('')

const { datos: historial, ejecutar: recargarHistorial } = useAsync(() => adminApi.registro())

const NOMBRE_RECURSO = {
  universidades: 'Universidad', facultades: 'Facultad', carreras: 'Carrera',
  convocatorias: 'Convocatoria', preuniversitarios: 'Preuniversitario',
}

function mostrar(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
const esEnlace = (t) => typeof t === 'string' && /^https?:\/\/\S+$/.test(t)

async function cargarTexto(texto) {
  errorEntrada.value = ''
  resultado.value = null
  errorAplicar.value = ''
  analisis.value = null
  let parsed
  try {
    parsed = JSON.parse(texto)
  } catch {
    errorEntrada.value = 'Eso no es un archivo de propuesta válido (no es JSON).'
    return
  }
  analizando.value = true
  try {
    analisis.value = await adminApi.analizarPropuesta(parsed)
    propuesta.value = parsed
    for (const k of Object.keys(aprobados)) delete aprobados[k]
    for (const c of analisis.value.cambios) {
      aprobados[c.indice] = false
      campos[c.indice] = c.diff.filter((d) => d.cambia).map((d) => d.campo)
    }
  } catch (e) {
    errorEntrada.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    analizando.value = false
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
  await cargarTexto(await archivo.text())
}

const validos = computed(() => (analisis.value?.cambios ?? []).filter((c) => c.valido))
const lista = computed(() =>
  (analisis.value?.cambios ?? [])
    .filter((c) => c.valido && aprobados[c.indice])
    .map((c) => ({ indice: c.indice, ...(c.accion === 'actualizar' ? { campos: campos[c.indice] ?? [] } : {}) })),
)

function marcarTodos(valor) {
  for (const c of validos.value) aprobados[c.indice] = valor
}

async function aplicar() {
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

function limpiar() {
  propuesta.value = null
  analisis.value = null
  resultado.value = null
  textoPegado.value = ''
  errorEntrada.value = ''
}

async function descargarReferencias() {
  try {
    const datos = await adminApi.referencias()
    const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'referencias.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) {
    errorEntrada.value = e.message
  }
}

const cuando = (iso) => new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
const campoCambiado = (r) => Object.keys(r.despues ?? {}).join(', ')
</script>

<template>
  <h1 class="mb-1 text-2xl">Importar propuesta</h1>
  <p class="mb-4 max-w-3xl text-ink-soft">
    Una propuesta son datos sugeridos por una IA (por ejemplo Claude leyendo un PDF o la foto de un afiche) con la
    <strong>cita de la fuente</strong> de cada dato. Aquí los revisas y solo se guarda lo que apruebes.
  </p>

  <ol class="mb-6 grid gap-3 text-sm sm:grid-cols-3">
    <li class="card"><strong>1. Carga</strong><br />Sube el archivo de propuesta o pega su texto.</li>
    <li class="card"><strong>2. Revisa</strong><br />Compara el antes y el después con la cita de la fuente.</li>
    <li class="card"><strong>3. Aprueba</strong><br />Marca lo que sí. Lo demás no se toca.</li>
  </ol>

  <section v-if="!analisis" class="card space-y-4" aria-labelledby="i-carga">
    <h2 id="i-carga" class="text-lg">1. Cargar la propuesta</h2>
    <div class="flex flex-wrap gap-3">
      <label class="btn-primary cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
        <i class="ti ti-file-import" aria-hidden="true"></i> Elegir archivo (.json)
        <input type="file" accept=".json,application/json" class="sr-only" @change="elegirArchivo" />
      </label>
      <button type="button" class="btn-ghost" @click="descargarReferencias">
        <i class="ti ti-download" aria-hidden="true"></i> Descargar referencias
      </button>
    </div>
    <p class="text-sm text-ink-soft">
      «Referencias» es la lista de universidades, facultades y números internos. Dásela a la IA para que sepa a qué
      registro corresponde cada dato.
    </p>
    <div>
      <label for="pegado" class="mb-1 block font-bold">O pega el texto de la propuesta</label>
      <textarea id="pegado" v-model="textoPegado" rows="5" class="field font-mono text-sm" placeholder='{ "formato": 1, "cambios": [ … ] }'></textarea>
      <button type="button" class="btn-ghost mt-2" :disabled="!textoPegado.trim()" @click="cargarTexto(textoPegado)">Revisar texto pegado</button>
    </div>
    <p v-if="analizando" role="status" class="font-bold"><i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Revisando…</p>
    <p v-if="errorEntrada" role="alert" class="font-bold text-bad-fg">{{ errorEntrada }}</p>
  </section>

  <section v-else aria-labelledby="i-revisa">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="i-revisa" class="text-lg">2. Revisar: {{ analisis.total }} {{ analisis.total === 1 ? 'cambio' : 'cambios' }}</h2>
        <p class="text-sm text-ink-soft">
          Fuente:
          <a v-if="esEnlace(analisis.fuente)" :href="analisis.fuente" target="_blank" rel="noopener" class="font-bold text-brand underline">{{ analisis.fuente }}</a>
          <strong v-else>{{ analisis.fuente || 'no indicada' }}</strong>
          <span v-if="analisis.origen"> · origen: {{ analisis.origen }}</span>
        </p>
      </div>
      <button type="button" class="btn-ghost !min-h-10 !px-4 !py-1.5 text-sm" @click="limpiar">Cargar otra</button>
    </div>

    <p v-if="resultado" role="status" class="card mb-4 border-ok-fg bg-ok-bg text-ok-fg">
      <strong>
        <i class="ti ti-circle-check" aria-hidden="true"></i>
        {{ resultado.aplicados.length === 1 ? 'Se aplicó 1 cambio.' : `Se aplicaron ${resultado.aplicados.length} cambios.` }}
      </strong>
      La página pública ya los muestra.
      <span v-for="o in resultado.omitidos" :key="o.indice" class="mt-1 block font-bold text-warn-fg">No se aplicó el cambio {{ o.indice + 1 }}: {{ o.motivo }}</span>
    </p>

    <ul class="space-y-4">
      <li v-for="c in analisis.cambios" :key="c.indice" class="card space-y-3" :class="aprobados[c.indice] ? '!border-brand' : ''">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-sm font-bold text-ink-soft">
              {{ c.accion === 'crear' ? 'Crear' : 'Actualizar' }} · {{ NOMBRE_RECURSO[c.recurso] }}
              <span v-if="c.confianza">· confianza {{ c.confianza }}</span>
            </p>
            <h3 class="text-lg">{{ c.titulo }}</h3>
          </div>
          <span class="rounded-full px-3 py-1 text-sm font-bold" :class="c.valido ? 'bg-ok-bg text-ok-fg' : 'bg-bad-bg text-bad-fg'">
            {{ c.valido ? '✔ Válido' : '▲ Con errores' }}
          </span>
        </div>

        <ul v-if="c.errores.length" role="alert" class="list-disc space-y-0.5 pl-5 font-bold text-bad-fg">
          <li v-for="e in c.errores" :key="e">{{ e }}</li>
        </ul>
        <ul v-if="c.advertencias.length" class="list-disc space-y-0.5 pl-5 font-bold text-warn-fg">
          <li v-for="a in c.advertencias" :key="a">{{ a }}</li>
        </ul>

        <div v-if="c.diff.length" class="overflow-x-auto rounded-xl border-2 border-line">
          <table class="w-full text-left text-sm">
            <caption class="sr-only">Qué cambia en {{ c.titulo }}</caption>
            <thead class="bg-brand-soft">
              <tr>
                <th v-if="c.accion === 'actualizar'" scope="col" class="w-10 px-3 py-2"><span class="sr-only">Aceptar este campo</span></th>
                <th scope="col" class="px-3 py-2">Campo</th>
                <th scope="col" class="px-3 py-2">Ahora</th>
                <th scope="col" class="px-3 py-2">Propuesto</th>
                <th scope="col" class="px-3 py-2">Cita de la fuente</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in c.diff" :key="d.campo" class="border-t-2 border-line align-top" :class="d.cambia ? '' : 'text-ink-soft'">
                <td v-if="c.accion === 'actualizar'" class="px-3 py-2">
                  <input v-model="campos[c.indice]" type="checkbox" class="size-5 accent-brand" :value="d.campo" :disabled="!d.cambia || !c.valido" :aria-label="`Aceptar ${d.campo}`" />
                </td>
                <td class="px-3 py-2 font-bold">{{ d.campo }}</td>
                <td class="px-3 py-2">{{ mostrar(d.antes) }}</td>
                <td class="px-3 py-2 font-bold">{{ mostrar(d.despues) }}<span v-if="!d.cambia" class="font-normal"> (igual)</span></td>
                <td class="px-3 py-2">{{ d.evidencia ? `«${d.evidencia}»` : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <label class="flex items-center gap-3">
          <input v-model="aprobados[c.indice]" type="checkbox" class="size-6 accent-brand" :disabled="!c.valido" />
          <span class="font-bold">Aprobar este cambio</span>
        </label>
      </li>
    </ul>

    <div class="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" class="btn-ghost" @click="marcarTodos(true)">Marcar todos los válidos</button>
      <button type="button" class="btn-ghost" @click="marcarTodos(false)">Quitar todas las marcas</button>
      <button type="button" class="btn-primary" :aria-busy="aplicando" @click="aplicar">
        {{ aplicando ? 'Aplicando…' : `Aplicar ${lista.length} ${lista.length === 1 ? 'cambio aprobado' : 'cambios aprobados'}` }}
      </button>
    </div>
    <p class="mt-2 text-sm text-ink-soft">
      Al aplicar, cada registro queda con la <strong>fecha de hoy como verificación</strong> y, si la fuente es un enlace, con ese enlace.
      Todo queda anotado en el historial.
    </p>
    <p v-if="!lista.length" class="mt-1 text-sm text-warn-fg">Todavía no marcaste ningún cambio para aprobar.</p>
    <p v-if="errorAplicar" role="alert" class="mt-2 font-bold text-bad-fg">{{ errorAplicar }}</p>
  </section>

  <section class="mt-10" aria-labelledby="i-historial">
    <h2 id="i-historial" class="mb-2 text-lg">Historial de lo aprobado</h2>
    <p v-if="!historial?.length" class="card text-ink-soft">Todavía no se aprobó ninguna propuesta.</p>
    <ul v-else class="space-y-2">
      <li v-for="r in historial.slice(0, 12)" :key="r.id" class="card !p-3">
        <p class="font-bold">
          {{ r.accion === 'crear' ? 'Creó' : 'Actualizó' }} · {{ NOMBRE_RECURSO[r.recurso] ?? r.recurso }} #{{ r.fila_id }}
          <span class="font-normal text-ink-soft">· {{ cuando(r.creado_en) }}</span>
        </p>
        <p class="text-sm text-ink-soft">
          Campos: {{ campoCambiado(r) }} · Fuente:
          <a v-if="esEnlace(r.fuente)" :href="r.fuente" target="_blank" rel="noopener" class="font-bold text-brand underline">{{ r.fuente }}</a>
          <span v-else>{{ r.fuente || 'no indicada' }}</span>
        </p>
      </li>
    </ul>
  </section>
</template>
