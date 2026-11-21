const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Las fechas llegan como "AAAA-MM-DD"; se leen como fecha local para no correrse un día.
export function fecha(iso) {
  if (!iso) return 'Por confirmar'
  const [a, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${a}`
}

export function bs(monto) {
  return monto == null ? 'Por confirmar' : `Bs ${monto.toLocaleString('es-BO')}`
}

export const TIPOS = { publica: 'Pública', privada: 'Privada', tecnico: 'Técnica' }
export const MODALIDAD_PRE = { presencial: 'Presencial', virtual: 'Virtual', mixta: 'Mixta' }
export const MODALIDAD_INGRESO = {
  examen: 'Examen de ingreso',
  preuniversitario: 'Preuniversitario',
  ambos: 'Examen o preuniversitario',
}

export function diasTexto(estado, dias) {
  if (dias == null) return ''
  if (estado === 'abierta') return dias === 0 ? 'Cierra hoy' : `Cierra en ${dias} día${dias === 1 ? '' : 's'}`
  if (estado === 'proxima') return `Abre en ${dias} día${dias === 1 ? '' : 's'}`
  return ''
}
