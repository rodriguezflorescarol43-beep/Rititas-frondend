// Motor de orientación que corre EN EL CELULAR. No usa nada del navegador (se puede probar con Node).
//
// `evaluar` hace lo mismo que backend/app/services/orientacion.py: una prueba automática compara
// ambos con las mismas respuestas. `planes` y `costoPrimerAnio` son nuevos (Plan A, B y C).
import { conEstado, estadoResumen, hoyISO } from './estado.js'

export const AVISO =
  'Esta orientación es una guía inicial, no un diagnóstico. Conversa con tu familia y con orientadores, y confirma las fechas con la universidad.'
const MAX_RECOMENDACIONES = 6
export const MESES_POR_DEFECTO = 10

export class RespuestasInvalidas extends Error {}

// Python redondea .5 hacia el número par; Math.round no. Se imita para que los porcentajes coincidan.
const redondear = (x) => {
  const f = Math.floor(x)
  const d = x - f
  if (d < 0.5) return f
  if (d > 0.5) return f + 1
  return f % 2 === 0 ? f : f + 1
}

function indices(paquete, hoy) {
  const universidades = new Map(paquete.universidades.map((u) => [u.id, u]))
  const facultades = new Map(paquete.facultades.map((f) => [f.id, f]))
  const convocatorias = new Map()
  for (const c of paquete.convocatorias) {
    const lista = convocatorias.get(c.facultad_id) ?? []
    lista.push(conEstado(c, hoy))
    convocatorias.set(c.facultad_id, lista)
  }
  return { universidades, facultades, convocatorias }
}

const motivo = (areaNombre, pct, costo, datos, mudarse) => {
  const partes = [`Encaja con tus intereses en ${areaNombre} (${pct}% de tus respuestas).`]
  if (costo != null && datos.presupuesto_max_bs != null) {
    partes.push(`Su costo estimado (Bs ${costo} al mes) entra en tu presupuesto.`)
  }
  if (datos.departamento && !mudarse) partes.push(`Está en ${datos.departamento}, donde vives.`)
  if (mudarse) partes.push('Tendrías que mudarte a otra ciudad.')
  return partes.join(' ')
}

// Aplica las condiciones de la persona. Devuelve { mudarse } o null si la carrera queda descartada.
function cumple(uni, datos) {
  const mudarse = Boolean(datos.departamento) && uni.departamento !== datos.departamento
  if (mudarse && (datos.puede_mudarse ?? true) === false) return null
  const tope = datos.presupuesto_max_bs ?? null
  if (tope != null && uni.costo_mensual_bs != null && uni.costo_mensual_bs > tope) return null
  return { mudarse }
}

export function evaluar(paquete, datos, hoy = hoyISO()) {
  const ids = new Set(datos.opciones)
  const opciones = paquete.preguntas
    .flatMap((p) => p.opciones)
    .filter((o) => ids.has(o.id))
    .sort((a, b) => a.id - b.id)
  if (!opciones.length) throw new RespuestasInvalidas('No se encontraron respuestas válidas')

  const conteo = new Map()
  for (const o of opciones) conteo.set(o.area, (conteo.get(o.area) ?? 0) + 1)
  const total = opciones.length
  const areas = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([area, n]) => ({ area, nombre: paquete.areas[area] ?? area, porcentaje: redondear((100 * n) / total) }))
  const pct = Object.fromEntries(areas.map((a) => [a.area, a.porcentaje]))
  const fuertes = areas.slice(0, 2).map((a) => a.area)

  const { universidades, facultades, convocatorias } = indices(paquete, hoy)
  const candidatas = []
  for (const carrera of [...paquete.carreras].sort((a, b) => a.id - b.id)) {
    if (!fuertes.includes(carrera.area)) continue
    const facultad = facultades.get(carrera.facultad_id)
    const uni = universidades.get(facultad.universidad_id)
    const condicion = cumple(uni, datos)
    if (!condicion) continue
    const { mudarse } = condicion
    const areaNombre = paquete.areas[carrera.area] ?? carrera.area
    candidatas.push([
      pct[carrera.area] - (mudarse ? 15 : 0),
      {
        carrera_id: carrera.id,
        carrera: carrera.nombre,
        facultad_id: facultad.id,
        facultad: facultad.nombre,
        universidad: uni.nombre,
        tipo: uni.tipo,
        ciudad: uni.ciudad,
        departamento: uni.departamento,
        area: carrera.area,
        area_nombre: areaNombre,
        costo_mensual_bs: uni.costo_mensual_bs,
        requiere_mudarse: mudarse,
        estado_convocatoria: estadoResumen(convocatorias.get(facultad.id) ?? []),
        motivo: motivo(areaNombre, pct[carrera.area], uni.costo_mensual_bs, datos, mudarse),
        // Nuevo: qué respuestas tuyas pesaron en esta recomendación.
        razones: opciones.filter((o) => o.area === carrera.area).map((o) => o.texto),
      },
    ])
  }
  candidatas.sort((a, b) => b[0] - a[0])
  return { areas, recomendaciones: candidatas.slice(0, MAX_RECOMENDACIONES).map((c) => c[1]), aviso: AVISO }
}

// ---------- Costo del primer año ----------

// Es una ESTIMACIÓN: usa los costos publicados y los supuestos que la persona puede cambiar.
export function costoPrimerAnio({ uni, convocatoria, preu = null, mudarse, viviendaMensual = null, meses = MESES_POR_DEFECTO }) {
  const lineas = []
  if (preu) lineas.push({ clave: 'preuniversitario', etiqueta: 'Preuniversitario', monto: preu.costo_bs ?? null })
  lineas.push({ clave: 'inscripcion', etiqueta: 'Inscripción', monto: convocatoria?.costo_inscripcion_bs ?? null })
  if (uni) {
    lineas.push({
      clave: 'mensualidades',
      etiqueta: `Mensualidades (${meses} meses)`,
      monto: uni.costo_mensual_bs == null ? null : uni.costo_mensual_bs * meses,
    })
  }
  if (mudarse) {
    lineas.push({
      clave: 'vivienda',
      etiqueta: `Vivienda y transporte (${meses} meses)`,
      monto: viviendaMensual == null ? null : viviendaMensual * meses,
    })
  }
  const total = lineas.reduce((suma, l) => suma + (l.monto ?? 0), 0)
  return { lineas, total, incompleto: lineas.some((l) => l.monto == null) }
}

// ---------- Plan A, B y C ----------

const TIPOS_POR_AREA = {
  salud: ['medicina', 'odontologia', 'bioquimica'],
  tecnologia: ['ciencias_tecnologia'],
  negocios: ['economicas'],
  social: ['juridicas', 'humanidades'],
  arte: ['arquitectura', 'humanidades'],
  naturaleza: ['ciencias_tecnologia', 'bioquimica'],
}

function convocatoriaRelevante(lista) {
  const orden = { proxima: 0, abierta: 1, cerrada: 2 }
  return [...lista].sort((a, b) => orden[a.estado] - orden[b.estado] || a.inscripcion_inicio.localeCompare(b.inscripcion_inicio))[0] ?? null
}

// Plan A: lo que más encaja. Plan B: una alternativa más cercana, corta o económica, por si no ingresas.
// Plan C: prepararte un tiempo y volver a intentar, con los preuniversitarios y la próxima convocatoria.
export function planes(paquete, resultado, cond = {}, hoy = hoyISO()) {
  const meses = cond.meses ?? MESES_POR_DEFECTO
  const viviendaMensual = cond.vivienda_mensual_bs ?? null
  const datos = { departamento: cond.departamento || null, presupuesto_max_bs: cond.presupuesto_max_bs ?? null, puede_mudarse: cond.puede_mudarse ?? true }
  const { universidades, facultades, convocatorias } = indices(paquete, hoy)
  const duraciones = new Map(paquete.carreras.map((c) => [c.id, c.duracion_anios]))

  const detalle = (carrera, extra = {}) => {
    const facultad = facultades.get(carrera.facultad_id)
    const uni = universidades.get(facultad.universidad_id)
    const convocatoria = convocatoriaRelevante(convocatorias.get(facultad.id) ?? [])
    const mudarse = Boolean(datos.departamento) && uni.departamento !== datos.departamento
    return {
      carrera_id: carrera.id, carrera: carrera.nombre, facultad_id: facultad.id, facultad: facultad.nombre,
      universidad: uni.nombre, tipo: uni.tipo, ciudad: uni.ciudad, departamento: uni.departamento,
      area: carrera.area, duracion_anios: carrera.duracion_anios, requiere_mudarse: mudarse,
      estado_convocatoria: estadoResumen(convocatorias.get(facultad.id) ?? []), convocatoria,
      costo: costoPrimerAnio({ uni, convocatoria, mudarse, viviendaMensual, meses }),
      ...extra,
    }
  }

  const recomendada = resultado.recomendaciones[0] ?? null
  const A = recomendada
    ? detalle({ id: recomendada.carrera_id, nombre: recomendada.carrera, facultad_id: recomendada.facultad_id, area: recomendada.area, duracion_anios: duraciones.get(recomendada.carrera_id) }, { motivo: recomendada.motivo, razones: recomendada.razones })
    : null

  // Plan B
  let B = null
  let avisoB = null
  if (A) {
    const fuertes = resultado.areas.slice(0, 2).map((a) => a.area)
    const pool = []
    for (const carrera of paquete.carreras) {
      if (carrera.id === A.carrera_id) continue
      const facultad = facultades.get(carrera.facultad_id)
      const uni = universidades.get(facultad.universidad_id)
      if (!fuertes.includes(carrera.area) && uni.tipo !== 'tecnico') continue
      if (!cumple(uni, datos)) continue
      pool.push(detalle(carrera))
    }
    pool.sort((a, b) =>
      Number(a.requiere_mudarse) - Number(b.requiere_mudarse) ||
      (a.costo.incompleto - b.costo.incompleto) ||
      a.costo.total - b.costo.total ||
      a.duracion_anios - b.duracion_anios ||
      a.carrera_id - b.carrera_id)
    const mejor = pool[0]
    if (mejor) {
      const mejoras = []
      if (A.requiere_mudarse && !mejor.requiere_mudarse) mejoras.push('no necesitas mudarte')
      if (mejor.costo.total < A.costo.total) mejoras.push('cuesta menos')
      if (mejor.duracion_anios < A.duracion_anios) mejoras.push('dura menos')
      if (mejoras.length) {
        B = { ...mejor, mejoras, motivo: `Es una alternativa más realista: ${mejoras.join(', ')}.` }
      }
    }
    if (!B) avisoB = 'Con tus condiciones no encontramos una alternativa claramente más cercana o económica que el Plan A.'
  }

  // Plan C
  let C = null
  const areaBase = A?.area ?? resultado.areas[0]?.area
  if (areaBase) {
    const tipos = TIPOS_POR_AREA[areaBase] ?? []
    const candidatos = paquete.preuniversitarios
      .filter((p) => !datos.departamento || p.departamento === datos.departamento || p.modalidad !== 'presencial')
      .map((p) => {
        const coincide = (p.facultades_tipos || '').split(',').some((t) => tipos.includes(t))
        const cerca = datos.departamento && p.departamento === datos.departamento
        return { p, puntos: (coincide ? 2 : 0) + (cerca ? 1 : 0) }
      })
      .sort((a, b) => b.puntos - a.puntos || (a.p.costo_bs ?? Infinity) - (b.p.costo_bs ?? Infinity) || a.p.id - b.p.id)
    const preu = candidatos[0]?.p ?? null
    const conv = A?.convocatoria ?? null
    const uniA = A ? universidades.get(facultades.get(A.facultad_id).universidad_id) : null
    C = {
      preuniversitario: preu,
      convocatoria: conv,
      proxima: conv && conv.estado !== 'cerrada' ? conv : null,
      costo: costoPrimerAnio({ uni: null, convocatoria: conv, preu, mudarse: false, meses }),
      universidad: uniA?.nombre ?? null,
      motivo: preu
        ? 'Si esta vez no ingresas o aún no estás listo, prepárate un tiempo y vuelve a intentar.'
        : 'No encontramos un preuniversitario con tus condiciones. Pregunta en tu colegio o a la universidad.',
    }
  }

  return { A, B, C, avisoB, supuestos: { meses, vivienda_mensual_bs: viviendaMensual } }
}
