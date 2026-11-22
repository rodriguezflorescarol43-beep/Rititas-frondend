<script setup>
import { computed, ref } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import AsyncState from '../components/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'
import PlanCarrera from '../components/PlanCarrera.vue'
import PlanPreparate from '../components/PlanPreparate.vue'
import { datosDelPaquete, estadoPaquete } from '../datos/paquete'
import { planes as calcularPlanes } from '../datos/motor.js'

// La página es solo para Cochabamba: el test ya no pregunta departamento, presupuesto ni mudanza.
const paso = ref('inicio') // inicio | test | resultado

const { datos: preguntas, error: errorPreguntas, cargando: cargandoPreguntas, ejecutar: recargarPreguntas } = useAsync(() =>
  api.preguntas(),
)

const indice = ref(0)
const respuestas = ref({}) // id de pregunta -> id de opción
const aviso = ref('')
const actual = computed(() => preguntas.value?.[indice.value])
const total = computed(() => preguntas.value?.length ?? 0)

const resultado = ref(null)
const errorResultado = ref(null)
const calculando = ref(false)

function empezar() {
  indice.value = 0
  respuestas.value = {}
  resultado.value = null
  aviso.value = ''
  paso.value = 'test'
}

function elegir(opcion) {
  respuestas.value = { ...respuestas.value, [actual.value.id]: opcion.id }
  aviso.value = ''
}

function siguiente() {
  if (!respuestas.value[actual.value.id]) {
    aviso.value = 'Elige una opción para continuar.'
    return
  }
  if (indice.value < total.value - 1) indice.value++
  else calcular()
}

function atras() {
  aviso.value = ''
  if (indice.value > 0) indice.value--
  else paso.value = 'inicio'
}

async function calcular() {
  paso.value = 'resultado'
  calculando.value = true
  errorResultado.value = null
  try {
    resultado.value = await api.resultado({ opciones: Object.values(respuestas.value) })
  } catch (e) {
    errorResultado.value = e
  } finally {
    calculando.value = false
  }
}

// Los planes se calculan en el teléfono con el paquete de datos guardado.
const paquete = computed(() => {
  void estadoPaquete.version // se recalcula cuando llega un paquete nuevo
  return datosDelPaquete()
})
const misPlanes = computed(() => {
  if (!resultado.value || !paquete.value) return null
  return calcularPlanes(paquete.value, resultado.value)
})

// «Carreras que te pueden interesar»: solo la carrera y de qué trata (sin universidad, costo ni convocatoria).
// Una misma carrera suele estar en varias universidades: se muestra una sola vez.
// Solo se usa la descripción si es una frase simple: sin costos ni enlaces (eso es información de ingreso).
const esDescripcionSimple = (t) => !!t && t.length <= 160 && !/\bBs\b|https?:\/\//i.test(t)
const carreras = computed(() => {
  const vistas = new Set()
  const lista = []
  const descripciones = new Map((paquete.value?.carreras ?? []).map((c) => [c.id, c.descripcion]))
  for (const r of resultado.value?.recomendaciones ?? []) {
    const clave = r.carrera.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    if (vistas.has(clave)) continue
    vistas.add(clave)
    lista.push({ id: r.carrera_id, nombre: r.carrera, texto: (esDescripcionSimple(descripciones.get(r.carrera_id)) && descripciones.get(r.carrera_id)) || `Encaja con tus intereses en ${r.area_nombre}.` })
  }
  return lista
})
</script>

<template>
  <PageHeader
    titulo="¿No sabes qué estudiar?"
    subtitulo="Responde 8 preguntas cortas y te mostramos carreras que encajan contigo, con el motivo de cada una."
  />

  <section v-if="paso === 'inicio'" aria-label="Empezar el test" class="card max-w-xl space-y-4">
    <button type="button" class="btn-primary w-full" @click="empezar">
      Empezar el test <i class="ti ti-arrow-right" aria-hidden="true"></i>
    </button>
    <p class="text-sm text-ink-soft">Tus respuestas se calculan en tu teléfono. No te pedimos datos personales.</p>
  </section>

  <section v-else-if="paso === 'test'" aria-labelledby="t-test" class="max-w-xl">
    <AsyncState :cargando="cargandoPreguntas" :error="errorPreguntas" @reintentar="recargarPreguntas">
      <div v-if="actual">
        <p class="mb-2 font-bold text-ink-soft">Pregunta {{ indice + 1 }} de {{ total }}</p>
        <div
          class="mb-5 h-3 overflow-hidden rounded-full bg-off-bg"
          role="progressbar"
          aria-label="Avance del test"
          aria-valuemin="1"
          :aria-valuemax="total"
          :aria-valuenow="indice + 1"
        >
          <div class="h-3 bg-brand transition-all" :style="{ width: `${((indice + 1) / total) * 100}%` }"></div>
        </div>

        <h2 id="t-test" class="mb-4 text-xl">{{ actual.texto }}</h2>
        <ul class="space-y-3">
          <li v-for="op in actual.opciones" :key="op.id">
            <button
              type="button"
              class="card flex w-full items-center gap-3 text-left hover:border-brand"
              :class="respuestas[actual.id] === op.id ? '!border-brand bg-brand-soft' : ''"
              :aria-pressed="respuestas[actual.id] === op.id"
              @click="elegir(op)"
            >
              <i class="ti text-3xl text-brand" :class="op.icono" aria-hidden="true"></i>
              <span class="flex-1 text-lg">{{ op.texto }}</span>
              <span v-if="respuestas[actual.id] === op.id" class="font-bold text-brand" aria-hidden="true">✔</span>
            </button>
          </li>
        </ul>

        <p v-if="aviso" role="alert" class="mt-3 font-bold text-bad-fg">{{ aviso }}</p>
        <div class="mt-5 flex gap-3">
          <button type="button" class="btn-ghost" @click="atras">
            <i class="ti ti-arrow-left" aria-hidden="true"></i> Atrás
          </button>
          <button type="button" class="btn-primary flex-1" @click="siguiente">
            {{ indice === total - 1 ? 'Ver mi resultado' : 'Siguiente' }}
          </button>
        </div>
      </div>
    </AsyncState>
  </section>

  <section v-else aria-labelledby="t-res">
    <AsyncState :cargando="calculando" :error="errorResultado" @reintentar="calcular">
      <template v-if="resultado">
        <h2 id="t-res" class="mb-3 text-xl">Lo que más te gusta</h2>
        <ul class="mb-8 max-w-xl space-y-3">
          <li v-for="a in resultado.areas" :key="a.area">
            <div class="flex justify-between font-bold"><span>{{ a.nombre }}</span><span>{{ a.porcentaje }}%</span></div>
            <div class="h-3 overflow-hidden rounded-full bg-off-bg">
              <div class="h-3 bg-brand" :style="{ width: `${a.porcentaje}%` }"></div>
            </div>
          </li>
        </ul>

        <!-- Plan principal y dos salidas -->
        <section aria-labelledby="t-planes" class="mb-10">
          <h2 id="t-planes" class="mb-1 text-xl">Tus planes: A, B y C</h2>
          <p class="mb-4 max-w-2xl text-ink-soft">Un plan principal y dos salidas.</p>

          <template v-if="misPlanes">
            <div class="grid gap-4 lg:grid-cols-2">
              <PlanCarrera v-if="misPlanes.A" :plan="misPlanes.A" letra="A" titulo="Lo que más encaja contigo" tono="bg-brand text-white" />
              <PlanCarrera v-if="misPlanes.B" :plan="misPlanes.B" letra="B" titulo="Una opción más realista" tono="bg-mint-soft text-night" />
              <p v-else-if="misPlanes.avisoB" class="card self-start text-ink-soft">
                <strong class="text-ink">Plan B:</strong> {{ misPlanes.avisoB }}
              </p>
              <PlanPreparate v-if="misPlanes.C" :plan="misPlanes.C" />
            </div>
            <p v-if="!misPlanes.A" class="card mt-4">Todavía no encontramos un plan principal con tus respuestas.</p>
          </template>
          <p v-else class="card text-ink-soft">
            Los planes aparecen cuando los datos de la página se guardan en tu teléfono (unos segundos con señal).
            Vuelve a intentarlo en un momento.
          </p>
        </section>

        <h2 class="mb-3 text-xl">Carreras que te pueden interesar</h2>
        <p v-if="!carreras.length" class="card">Todavía no encontramos carreras con tus respuestas.</p>
        <ul class="grid gap-4 sm:grid-cols-2">
          <li v-for="c in carreras" :key="c.id" class="card flex flex-col gap-2">
            <h3 class="text-lg">{{ c.nombre }}</h3>
            <p>{{ c.texto }}</p>
          </li>
        </ul>

        <p class="mt-6 text-sm text-ink-soft">{{ resultado.aviso }}</p>

        <div class="no-print mt-6 flex flex-wrap gap-3">
          <button type="button" class="btn-ghost" @click="paso = 'inicio'">
            <i class="ti ti-refresh" aria-hidden="true"></i> Repetir el test
          </button>
        </div>
      </template>
    </AsyncState>
  </section>
</template>
