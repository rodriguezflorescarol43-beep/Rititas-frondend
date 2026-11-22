// Exporta fechas a un archivo .ics que abre cualquier calendario (también sin conexión).
const sinGuiones = (iso) => iso.replaceAll('-', '')

function sumarDia(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  const f = new Date(Date.UTC(a, m - 1, d + 1))
  return f.toISOString().slice(0, 10)
}

const escapar = (t) => String(t).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

export function crearIcs(eventos) {
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Despega//ES', 'CALSCALE:GREGORIAN']
  eventos.forEach((e, i) => {
    lineas.push(
      'BEGIN:VEVENT',
      `UID:guia-${sinGuiones(e.fecha)}-${i}@guia-ingreso`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;VALUE=DATE:${sinGuiones(e.fecha)}`,
      `DTEND;VALUE=DATE:${sinGuiones(sumarDia(e.fecha))}`,
      `SUMMARY:${escapar(e.titulo)}`,
      `DESCRIPTION:${escapar(e.detalle ?? '')}`,
      // Alarma un día antes: funciona aunque el teléfono no tenga señal ese día.
      ...(e.alarma ? ['BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${escapar(e.titulo)}`, 'END:VALARM'] : []),
      'END:VEVENT',
    )
  })
  lineas.push('END:VCALENDAR')
  return lineas.join('\r\n')
}

export function descargarIcs(nombreArchivo, eventos) {
  const blob = new Blob([crearIcs(eventos)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nombreArchivo}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function eventosDeConvocatoria(c, nombreFacultad, alarma = false) {
  const eventos = [
    { fecha: c.inscripcion_inicio, titulo: `Abre inscripción · ${nombreFacultad}`, detalle: c.titulo, alarma },
    { fecha: c.inscripcion_fin, titulo: `Último día de inscripción · ${nombreFacultad}`, detalle: c.titulo, alarma },
  ]
  if (c.fecha_examen) {
    eventos.push({ fecha: c.fecha_examen, titulo: `Examen de ingreso · ${nombreFacultad}`, detalle: c.titulo, alarma })
  }
  return eventos
}
