<script setup>
import { computed, ref, watch } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import AsyncState from '../components/AsyncState.vue'
import PageHeader from '../components/PageHeader.vue'
import PlanCarrera from '../components/PlanCarrera.vue'
import PlanPreparate from '../components/PlanPreparate.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { datosDelPaquete, estadoPaquete } from '../datos/paquete'
import { planes as calcularPlanes } from '../datos/motor.js'
import { descargarIcs, eventosDeConvocatoria } from '../utils/calendario'
import { textoPlan, textoPlanes, urlWhatsApp } from '../utils/compartir'
import { bs, TIPOS } from '../utils/format'

const PRESUPUESTOS = [
  ['', 'Sin límite'],
  [100, 'Hasta Bs 100 al mes'],
  [500, 'Hasta Bs 500 al mes'],
  [1000, 'Hasta Bs 1.000 al mes'],
  [2000, 'Hasta Bs 2.000 al mes'],
]

const paso = ref('condiciones') // condiciones | test | resultado
const cond = ref({ departamento: '', presupuesto: '', puedeMudarse: true })
const vivienda = ref('') // gasto mensual de vivienda y transporte si tuviera que mudarse
const meses = ref(10)

const { datos: meta } = useAsync(() => api.meta())
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
const avisoCalendario = ref('')

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
  else paso.value = 'condiciones'
}

const datosDelTest = () => ({
  opciones: Object.values(respuestas.value),
  departamento: cond.value.departamento || null,
  presupuesto_max_bs: cond.value.presupuesto === '' ? null : Number(cond.value.presupuesto),
  puede_mudarse: cond.value.puedeMudarse,
})

async function calcular() {
  paso.value = 'resultado'
  calculando.value = true
  errorResultado.value = null
  try {
    resultado.value = await api.resultado(datosDelTest())
  } catch (e) {
    errorResultado.value = e
  } finally {
    calculando.value = false
  }
}

// Simulador «¿y si…?»: al cambiar una condición se recalcula al instante, sin volver a hacer el test.
watch(
  () => [cond.value.departamento, cond.value.presupuesto, cond.value.puedeMudarse],
  async () => {
    if (paso.value !== 'resultado' || !resultado.value) return
    try {
      resultado.value = await api.resultado(datosDelTest())
    } catch (e) {
      errorResultado.value = e
    }
  },
)

// Los planes se calculan en el teléfono con el paquete de datos guardado.
const paquete = computed(() => {
  void estadoPaquete.version // se recalcula cuando llega un paquete nuevo
  return datosDelPaquete()
})
const misPlanes = computed(() => {
  if (!resultado.value || !paquete.value) return null
  return calcularPlanes(paquete.value, resultado.value, {
    departamento: cond.value.departamento,
    presupuesto_max_bs: cond.value.presupuesto === '' ? null : Number(cond.value.presupuesto),
    puede_mudarse: cond.value.puedeMudarse,
    vivienda_mensual_bs: vivienda.value === '' ? null : Number(vivienda.value),
    meses: Number(meses.value) || 10,
  })
})

const imprimir = () => window.print()

const enlaceWhatsApp = computed(() =>
  resultado.value ? urlWhatsApp(textoPlan(resultado.value, { departamento: cond.value.departamento })) : '#',
)
const enlacePlanCompleto = computed(() => (misPlanes.value ? urlWhatsApp(textoPlanes(misPlanes.value)) : '#'))

function recordatorios() {
  avisoCalendario.value = ''
  const eventos = []
  const agregar = (conv, nombre) => {
    if (conv && conv.estado !== 'cerrada') eventos.push(...eventosDeConvocatoria(conv, nombre, true))
  }
  const p = misPlanes.value
  agregar(p?.A?.convocatoria, p?.A?.carrera)
  agregar(p?.B?.convocatoria, p?.B?.carrera)
  agregar(p?.C?.proxima, 'Plan C')
  if (!eventos.length) {
    avisoCalendario.value = 'No hay fechas próximas para agregar a tu calendario.'
    return
  }
  descargarIcs('mis-recordatorios-de-ingreso', eventos)
}
</script>

<template>
  <PageHeader
    titulo="¿No sabes qué estudiar?"
    subtitulo="Responde 8 preguntas cortas y te mostramos carreras que encajan contigo, con el motivo de cada una."
  />

  <section v-if="paso === 'condiciones'" aria-labelledby="t-cond" class="card max-w-xl space-y-4">
    <h2 id="t-cond" class="text-xl">1. Tus condiciones</h2>
    <label class="block">
      <span class="mb-1 block font-bold">¿En qué departamento vives?</span>
      <select v-model="cond.departamento" class="field">
        <option value="">Prefiero no decirlo</option>
        <option v-for="d in meta?.departamentos ?? []" :key="d" :value="d">{{ d }}</option>
      </select>
    </label>
    <label class="block">
      <span class="mb-1 block font-bold">¿Cuánto puedes pagar al mes?</span>
      <select v-model="cond.presupuesto" class="field">
        <option v-for="[valor, texto] in PRESUPUESTOS" :key="valor" :value="valor">{{ texto }}</option>
      </select>
    </label>
    <label class="flex items-center gap-3">
      <input v-model="cond.puedeMudarse" type="checkbox" class="size-6 accent-brand" />
      <span class="font-bold">Puedo mudarme a otra ciudad para estudiar</span>
    </label>
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

        <!-- NUEVO: plan principal y dos salidas, con costo real del primer año -->
        <section aria-labelledby="t-planes" class="mb-10">
          <h2 id="t-planes" class="mb-1 text-xl">Tus planes: A, B y C</h2>
          <p class="mb-4 max-w-2xl text-ink-soft">Un plan principal y dos salidas, por si no ingresas o no puedes mudarte.</p>

          <div class="card mb-4 space-y-3">
            <h3 class="text-lg">¿Y si cambian tus condiciones?</h3>
            <p class="text-sm text-ink-soft">Cámbialas y los planes se recalculan al instante, en tu teléfono.</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="block">
                <span class="mb-1 block text-sm font-bold">Departamento</span>
                <select v-model="cond.departamento" class="field">
                  <option value="">Prefiero no decirlo</option>
                  <option v-for="d in meta?.departamentos ?? []" :key="d" :value="d">{{ d }}</option>
                </select>
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-bold">Cuánto puedes pagar al mes</span>
                <select v-model="cond.presupuesto" class="field">
                  <option v-for="[valor, texto] in PRESUPUESTOS" :key="valor" :value="valor">{{ texto }}</option>
                </select>
              </label>
              <label class="flex items-center gap-3 sm:col-span-2">
                <input v-model="cond.puedeMudarse" type="checkbox" class="size-6 accent-brand" />
                <span class="font-bold">Puedo mudarme a otra ciudad</span>
              </label>
              <label v-if="cond.departamento" class="block">
                <span class="mb-1 block text-sm font-bold">Vivienda y transporte al mes (Bs)</span>
                <input v-model="vivienda" type="number" min="0" inputmode="numeric" class="field" placeholder="Si tendrías que mudarte" />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-bold">Meses de estudio al año</span>
                <input v-model="meses" type="number" min="1" max="12" inputmode="numeric" class="field" />
              </label>
            </div>
          </div>

          <template v-if="misPlanes">
            <div class="grid gap-4 lg:grid-cols-2">
              <PlanCarrera v-if="misPlanes.A" :plan="misPlanes.A" letra="A" titulo="Lo que más encaja contigo" tono="bg-brand text-white" />
              <PlanCarrera v-if="misPlanes.B" :plan="misPlanes.B" letra="B" titulo="Una opción más realista" tono="bg-mint-soft text-night" />
              <p v-else-if="misPlanes.avisoB" class="card self-start text-ink-soft">
                <strong class="text-ink">Plan B:</strong> {{ misPlanes.avisoB }}
              </p>
              <PlanPreparate v-if="misPlanes.C" :plan="misPlanes.C" />
            </div>
            <p v-if="!misPlanes.A" class="card mt-4">
              Con esas condiciones no encontramos un plan principal. Prueba con un presupuesto mayor o permitiendo mudarte.
            </p>
            <div class="no-print mt-4 flex flex-wrap gap-3">
              <a :href="enlacePlanCompleto" target="_blank" rel="noopener" class="btn-primary">
                <i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Enviar plan completo a mi familia
              </a>
              <button type="button" class="btn-ghost" @click="recordatorios">
                <i class="ti ti-bell-ringing" aria-hidden="true"></i> Recordatorios en mi calendario
              </button>
            </div>
            <p v-if="avisoCalendario" role="status" class="mt-2 font-bold text-warn-fg">{{ avisoCalendario }}</p>
          </template>
          <p v-else class="card text-ink-soft">
            Los planes aparecen cuando los datos de la página se guardan en tu teléfono (unos segundos con señal).
            Vuelve a intentarlo en un momento.
          </p>
        </section>

        <h2 class="mb-3 text-xl">Carreras que te pueden interesar</h2>
        <p v-if="!resultado.recomendaciones.length" class="card">
          Con esas condiciones no encontramos opciones. Prueba con un presupuesto mayor o permitiendo mudarte.
        </p>
        <ul class="grid gap-4 sm:grid-cols-2">
          <li v-for="r in resultado.recomendaciones" :key="`${r.carrera_id}`" class="card flex flex-col gap-2">
            <h3 class="text-lg">{{ r.carrera }}</h3>
            <p class="text-sm text-ink-soft">{{ r.universidad }} · {{ TIPOS[r.tipo] }} · {{ r.ciudad }}</p>
            <p>{{ r.motivo }}</p>
            <p v-if="r.costo_mensual_bs != null" class="text-sm"><strong>{{ bs(r.costo_mensual_bs) }}</strong> al mes (estimado)</p>
            <div class="flex flex-wrap gap-2">
              <StatusBadge :estado="r.estado_convocatoria" />
              <span v-if="r.requiere_mudarse" class="inline-flex items-center rounded-full bg-warn-bg px-3 py-1 text-sm font-bold text-warn-fg">
                ◆ Tendrías que mudarte
              </span>
            </div>
            <RouterLink :to="`/facultades/${r.facultad_id}`" class="btn-ghost mt-auto">Ver convocatoria</RouterLink>
          </li>
        </ul>

        <p class="mt-6 text-sm text-ink-soft">{{ resultado.aviso }}</p>

        <div class="no-print mt-6 flex flex-wrap gap-3">
          <a :href="enlaceWhatsApp" target="_blank" rel="noopener" class="btn-primary">
            <i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Enviar por WhatsApp
          </a>
          <button type="button" class="btn-ghost" @click="imprimir">
            <i class="ti ti-printer" aria-hidden="true"></i> Imprimir
          </button>
          <button type="button" class="btn-ghost" @click="paso = 'condiciones'">
            <i class="ti ti-refresh" aria-hidden="true"></i> Repetir el test
          </button>
        </div>
      </template>
    </AsyncState>
  </section>
</template>
