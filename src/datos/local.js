// «Servidor en el bolsillo»: responde lo mismo que la API, pero con el paquete guardado en el celular.
// Así las pantallas no cambian: piden datos a `api/servicios.js`, que usa esto cuando hay paquete.
import { ApiError } from '../api/client'
import { conEstado, estadoResumen, hoyISO } from './estado.js'
import { evaluar, RespuestasInvalidas } from './motor.js'
import { datosDelPaquete } from './paquete.js'

const P = () => datosDelPaquete()
const por = (campo) => (a, b) => (a[campo] < b[campo] ? -1 : a[campo] > b[campo] ? 1 : 0)

const convocatoriasDe = (facultadId, hoy) =>
  P().convocatorias.filter((c) => c.facultad_id === facultadId).map((c) => conEstado(c, hoy)).sort(por('inscripcion_inicio'))

function resumenFacultad(f, hoy) {
  const uni = P().universidades.find((u) => u.id === f.universidad_id)
  return {
    id: f.id, nombre: f.nombre, area: f.area, area_nombre: P().areas[f.area] ?? f.area,
    universidad_id: uni.id, universidad_nombre: uni.nombre, universidad_sigla: uni.sigla,
    tipo: uni.tipo, ciudad: uni.ciudad, departamento: uni.departamento,
    n_carreras: P().carreras.filter((c) => c.facultad_id === f.id).length,
    estado_convocatoria: estadoResumen(convocatoriasDe(f.id, hoy)),
  }
}

export const local = {
  meta: () => ({ departamentos: P().departamentos, areas: P().areas, facultades_tipo: P().facultades_tipo }),

  ajustes: () => P().ajustes,

  universidades: ({ tipo, departamento } = {}) =>
    [...P().universidades]
      .filter((u) => (!tipo || u.tipo === tipo) && (!departamento || u.departamento === departamento))
      .sort(por('nombre')),

  facultades: ({ universidad_id: uni, area } = {}, hoy = hoyISO()) =>
    [...P().facultades]
      .filter((f) => (!uni || f.universidad_id === Number(uni)) && (!area || f.area === area))
      .sort(por('nombre'))
      .map((f) => resumenFacultad(f, hoy)),

  facultad: (id, hoy = hoyISO()) => {
    const f = P().facultades.find((x) => x.id === Number(id))
    if (!f) throw new ApiError('Facultad no encontrada', 404)
    return {
      ...resumenFacultad(f, hoy),
      universidad: P().universidades.find((u) => u.id === f.universidad_id),
      carreras: P().carreras.filter((c) => c.facultad_id === f.id).sort(por('nombre')),
      convocatorias: convocatoriasDe(f.id, hoy),
    }
  },

  convocatorias: ({ estado } = {}, hoy = hoyISO()) =>
    P().convocatorias.map((c) => conEstado(c, hoy)).filter((c) => !estado || c.estado === estado).sort(por('inscripcion_fin')),

  preuniversitarios: ({ departamento } = {}) =>
    [...P().preuniversitarios]
      .filter((p) => !departamento || p.departamento === departamento)
      .sort((a, b) => por('departamento')(a, b) || por('nombre')(a, b)),

  preuniversitario: (id) => {
    const p = P().preuniversitarios.find((x) => x.id === Number(id))
    if (!p) throw new ApiError('Preuniversitario no encontrado', 404)
    return p
  },

  embajadores: () => P().embajadores,

  preguntas: () =>
    P().preguntas.map((p) => ({
      id: p.id,
      texto: p.texto,
      opciones: p.opciones.map(({ id, texto, icono }) => ({ id, texto, icono })),
    })),

  resultado: (datos) => {
    try {
      return evaluar(P(), datos)
    } catch (e) {
      if (e instanceof RespuestasInvalidas) throw new ApiError(e.message, 422)
      throw e
    }
  },
}
