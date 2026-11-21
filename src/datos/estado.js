// Estado de una convocatoria según la fecha de hoy.
// Se calcula en el celular (no en el servidor): así nunca queda desactualizado, aunque los datos
// se hayan guardado hace días y no haya señal. Misma regla que backend/app/services/convocatorias.py.

export const hoyISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const dia = (iso) => {
  const [a, m, d] = iso.split('-').map(Number)
  return Date.UTC(a, m - 1, d) / 86400000
}

// Las fechas ISO (AAAA-MM-DD) se pueden comparar como texto.
export function calcularEstado(inicio, fin, hoy = hoyISO()) {
  if (hoy < inicio) return 'proxima'
  if (hoy > fin) return 'cerrada'
  return 'abierta'
}

export function diasRestantes(estado, c, hoy = hoyISO()) {
  if (estado === 'abierta') return dia(c.inscripcion_fin) - dia(hoy)
  if (estado === 'proxima') return dia(c.inscripcion_inicio) - dia(hoy)
  return null
}

export function conEstado(c, hoy = hoyISO()) {
  const estado = calcularEstado(c.inscripcion_inicio, c.inscripcion_fin, hoy)
  return { ...c, estado, dias_restantes: diasRestantes(estado, c, hoy) }
}

const ORDEN = { abierta: 0, proxima: 1, cerrada: 2 }

// El estado más útil para una familia: abierta, si no próxima, si no cerrada.
export function estadoResumen(convocatorias) {
  if (!convocatorias.length) return null
  return convocatorias.map((c) => c.estado).sort((a, b) => ORDEN[a] - ORDEN[b])[0]
}
