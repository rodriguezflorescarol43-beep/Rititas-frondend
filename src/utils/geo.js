// Ubicación y mapas. La ubicación se usa SOLO en el teléfono para ordenar por cercanía: nunca se envía.

export function distanciaKm(a, b) {
  const R = 6371
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function ubicacionActual() {
  return new Promise((resolver, rechazar) => {
    if (!navigator.geolocation) {
      rechazar(new Error('Tu teléfono no permite usar la ubicación.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => rechazar(new Error('No pudimos obtener tu ubicación. Revisa el permiso o elige tu departamento.')),
      { timeout: 10000, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false },
    )
  })
}

export const formatoKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`)

// «Cómo llegar» abre el mapa del propio teléfono. No se incrusta un mapa: pesaría mucho con señal débil.
export function enlaceMapa(p) {
  const consulta =
    p.latitud != null && p.longitud != null
      ? `${p.latitud},${p.longitud}`
      : encodeURIComponent([p.direccion, p.ciudad].filter(Boolean).join(', '))
  return `https://www.google.com/maps/search/?api=1&query=${consulta}`
}

export const enlaceWhatsApp = (numero, texto = '') =>
  `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
