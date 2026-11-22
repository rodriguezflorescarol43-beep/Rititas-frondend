import { bs, fecha } from './format'

const ESTADO = { abierta: 'inscripción abierta', proxima: 'próxima convocatoria', cerrada: 'convocatoria cerrada' }

// Arma el texto del plan para enviarlo por WhatsApp o imprimirlo.
export function textoPlan(resultado, condiciones) {
  const lineas = ['Mi plan para entrar a la universidad', '']
  if (resultado.areas?.length) {
    lineas.push('Lo que más me gusta: ' + resultado.areas.slice(0, 2).map((a) => `${a.nombre} (${a.porcentaje}%)`).join(', '), '')
  }
  resultado.recomendaciones.forEach((r, i) => {
    const costo = r.costo_mensual_bs != null ? ` · ${bs(r.costo_mensual_bs)} al mes` : ''
    const estado = r.estado_convocatoria ? ` · ${ESTADO[r.estado_convocatoria]}` : ''
    lineas.push(`${i + 1}. ${r.carrera} — ${r.universidad} (${r.ciudad})${costo}${estado}`)
  })
  if (condiciones?.departamento) lineas.push('', `Vivo en: ${condiciones.departamento}`)
  lineas.push('', 'Confirma las fechas con la universidad antes de inscribirte.')
  return lineas.join('\n')
}

const costoTexto = (c) => `${bs(c.total)}${c.incompleto ? ' (más lo que aún no sabemos)' : ''}`

// Texto del plan completo (A, B y C) para la familia: se envía por WhatsApp o se imprime.
export function textoPlanes(p) {
  const L = ['Mi plan para entrar a la universidad', '']
  const carrera = (letra, plan) => {
    L.push(`PLAN ${letra} · ${plan.carrera} — ${plan.universidad} (${plan.ciudad})`)
    L.push(`  Primer año (estimado): ${costoTexto(plan.costo)}`)
    if (plan.requiere_mudarse) L.push('  Tendría que mudarme a otra ciudad.')
    const c = plan.convocatoria
    if (c) L.push(`  Inscripción: ${fecha(c.inscripcion_inicio)} al ${fecha(c.inscripcion_fin)} (${ESTADO[c.estado]})`)
    L.push('')
  }
  if (p.A) carrera('A', p.A)
  if (p.B) carrera('B', p.B)
  if (p.C?.preuniversitario) {
    const pre = p.C.preuniversitario
    L.push(`PLAN C · Prepararme primero: ${pre.nombre} (${pre.duracion_meses ? `${pre.duracion_meses} meses` : 'duración por confirmar'}, ${bs(pre.costo_bs)})`)
    if (p.C.proxima) {
      L.push(`  Próxima inscripción: ${fecha(p.C.proxima.inscripcion_inicio)} al ${fecha(p.C.proxima.inscripcion_fin)}`)
    }
    L.push('')
  }
  L.push('Son costos estimados. Confirma fechas y costos con la universidad antes de inscribirte.')
  return L.join('\n')
}

export const urlWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`
