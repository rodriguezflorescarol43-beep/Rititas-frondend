<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { adminApi } from '../../api/admin'
import { RECURSOS } from '../../admin/recursos'
import CampoForm from '../../components/admin/CampoForm.vue'
import { fecha } from '../../utils/format'

// Pantalla única para administrar universidades, facultades, carreras, convocatorias e institutos.
const props = defineProps({ recurso: { type: String, required: true } })
const route = useRoute()
const config = computed(() => RECURSOS[props.recurso])

const filas = ref([])
const referencias = ref({}) // listas de las que dependen los selects, por nombre
const cargando = ref(false)
const error = ref('')
const aviso = ref('')

const editando = ref(null) // null | 'nuevo' | id
const form = ref({})
const errorForm = ref('')
const guardando = ref(false)
const confirmando = ref(null)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const deps = config.value.dependencias ?? []
    const [lista, ...extras] = await Promise.all([
      adminApi.listar(props.recurso),
      ...deps.map((d) => (d === 'medios' ? adminApi.medios() : adminApi.listar(d))),
    ])
    filas.value = lista
    referencias.value = Object.fromEntries(deps.map((d, i) => [d, extras[i]]))
    // «Abrir y corregir» desde «Qué revisar hoy» llega con ?editar=ID: se abre ese registro directamente.
    const pedido = Number(route.query.editar)
    const fila = pedido ? lista.find((f) => f.id === pedido) : null
    if (fila) abrir(fila)
  } catch (e) {
    error.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    cargando.value = false
  }
}

watch(
  () => props.recurso,
  () => {
    editando.value = null
    aviso.value = ''
    cargar()
  },
  { immediate: true },
)

function etiquetaDe(desde, id) {
  const fila = referencias.value[desde]?.find((f) => f.id === id)
  if (!fila) return `#${id}`
  if (desde === 'facultades') {
    const uni = referencias.value.universidades?.find((u) => u.id === fila.universidad_id)
    return uni ? `${fila.nombre} (${uni.sigla})` : fila.nombre
  }
  return fila.nombre
}

function opcionesDe(campo) {
  if (campo.desde) return (referencias.value[campo.desde] ?? []).map((f) => [f.id, etiquetaDe(campo.desde, f.id)])
  return campo.opciones ?? []
}

const imagenes = computed(() =>
  (referencias.value.medios ?? []).filter((m) => m.tipo === 'imagen').map((m) => ({ url: m.url, nombre: m.nombre })),
)

function celda(columna, fila) {
  const v = fila[columna.clave]
  if (columna.bool) return v ? '✔ Sí' : 'No'
  if (v == null || v === '') return '—'
  if (columna.bool) return v ? '✔ Sí' : 'No'
  if (columna.desde) return etiquetaDe(columna.desde, v)
  if (columna.opciones) return columna.opciones[v] ?? v
  if (columna.fecha) return fecha(v)
  return v
}

function abrir(fila) {
  errorForm.value = ''
  aviso.value = ''
  form.value = fila
    ? { ...fila }
    : Object.fromEntries(config.value.campos.map((c) => [c.clave, c.tipo === 'bool' ? false : '']))
  editando.value = fila ? fila.id : 'nuevo'
}

function cerrar() {
  editando.value = null
  errorForm.value = ''
}

function armarDatos() {
  const datos = {}
  for (const c of config.value.campos) {
    let v = form.value[c.clave]
    if (c.tipo === 'bool') {
      datos[c.clave] = !!v
      continue
    }
    if (v === '' || v == null) v = c.nulo || c.tipo === 'numero' || c.tipo === 'select' ? null : ''
    else if (c.tipo === 'numero') v = Number(v)
    else if (typeof v === 'string') v = v.trim()
    datos[c.clave] = v
  }
  return datos
}

async function guardar() {
  errorForm.value = ''
  guardando.value = true
  try {
    const datos = armarDatos()
    if (editando.value === 'nuevo') await adminApi.crear(props.recurso, datos)
    else await adminApi.actualizar(props.recurso, editando.value, datos)
    aviso.value = editando.value === 'nuevo' ? 'Se creó correctamente.' : 'Cambios guardados.'
    editando.value = null
    await cargar()
  } catch (e) {
    errorForm.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    guardando.value = false
  }
}

async function borrar(id) {
  aviso.value = ''
  error.value = ''
  try {
    await adminApi.borrar(props.recurso, id)
    confirmando.value = null
    aviso.value = 'Se borró.'
    await cargar()
  } catch (e) {
    confirmando.value = null
    error.value = e.message
  }
}
</script>

<template>
  <div v-if="config">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl">{{ config.titulo }}</h1>
      <button v-if="!editando" type="button" class="btn-primary" @click="abrir(null)">
        <i class="ti ti-plus" aria-hidden="true"></i> Nueva {{ config.singular }}
      </button>
    </div>

    <p v-if="aviso" role="status" class="card mb-4 border-ok-fg bg-ok-bg font-bold text-ok-fg">
      <i class="ti ti-circle-check" aria-hidden="true"></i> {{ aviso }}
    </p>
    <p v-if="error" role="alert" class="card mb-4 border-bad-fg bg-bad-bg font-bold text-bad-fg">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ error }}
    </p>

    <form v-if="editando" class="card mb-6 space-y-4" @submit.prevent="guardar">
      <h2 class="text-lg">{{ editando === 'nuevo' ? `Nueva ${config.singular}` : `Editar ${config.singular}` }}</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <CampoForm
          v-for="c in config.campos"
          :key="c.clave"
          v-model="form[c.clave]"
          :campo="c"
          :opciones="opcionesDe(c)"
          :imagenes="imagenes"
        />
      </div>
      <p v-if="errorForm" role="alert" class="font-bold text-bad-fg">{{ errorForm }}</p>
      <div class="flex flex-wrap gap-3">
        <button type="submit" class="btn-primary" :aria-busy="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
        <button type="button" class="btn-ghost" @click="cerrar">Cancelar</button>
      </div>
    </form>

    <p v-if="cargando" role="status" class="text-ink-soft"><i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Cargando…</p>
    <p v-else-if="!filas.length && !error" class="card text-center text-ink-soft">Todavía no hay registros.</p>

    <div v-else-if="filas.length" class="overflow-x-auto rounded-2xl border-2 border-line bg-card">
      <table class="w-full text-left">
        <caption class="sr-only">{{ config.titulo }}</caption>
        <thead class="bg-brand-soft text-sm">
          <tr>
            <th v-for="c in config.columnas" :key="c.clave" scope="col" class="px-4 py-3">{{ c.etiqueta }}</th>
            <th scope="col" class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filas" :key="f.id" class="border-t-2 border-line align-top">
            <td v-for="c in config.columnas" :key="c.clave" class="px-4 py-3">{{ celda(c, f) }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-right">
              <template v-if="confirmando === f.id">
                <span class="mr-2 font-bold text-bad-fg">¿Borrar?</span>
                <button type="button" class="btn-ghost !min-h-10 !border-bad-fg !px-3 !py-1 text-sm !text-bad-fg" @click="borrar(f.id)">Sí, borrar</button>
                <button type="button" class="btn-ghost !min-h-10 !px-3 !py-1 text-sm" @click="confirmando = null">No</button>
              </template>
              <template v-else>
                <button type="button" class="btn-ghost !min-h-10 !px-3 !py-1 text-sm" :aria-label="`Editar ${f.nombre ?? f.titulo}`" @click="abrir(f)">
                  <i class="ti ti-pencil" aria-hidden="true"></i> Editar
                </button>
                <button type="button" class="btn-ghost ml-1 !min-h-10 !px-3 !py-1 text-sm" :aria-label="`Borrar ${f.nombre ?? f.titulo}`" @click="confirmando = f.id">
                  <i class="ti ti-trash" aria-hidden="true"></i> Borrar
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
