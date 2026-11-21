// Capa de acceso a la API: un solo lugar que habla con el backend.
const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(mensaje, estado = 0, sinConexion = false) {
    super(mensaje)
    this.estado = estado
    this.sinConexion = sinConexion
  }
}

// `cuerpo` se envía como JSON; `archivo` es un FormData (subidas); `token` activa la sesión de administrador.
export async function pedir(ruta, { metodo = 'GET', cuerpo, archivo, params, token } = {}) {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    : ''
  const cabeceras = {}
  if (cuerpo) cabeceras['Content-Type'] = 'application/json'
  if (token) cabeceras.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${BASE}/api${ruta}${query}`, {
      method: metodo,
      headers: cabeceras,
      body: archivo ?? (cuerpo ? JSON.stringify(cuerpo) : undefined),
    })
  } catch {
    throw new ApiError('Sin conexión con el servidor', 0, true)
  }
  if (!respuesta.ok) {
    let detalle = ''
    try {
      detalle = (await respuesta.json()).detail
    } catch {
      /* sin cuerpo JSON */
    }
    throw new ApiError(typeof detalle === 'string' && detalle ? detalle : 'Revisa los datos e intenta de nuevo', respuesta.status)
  }
  if (respuesta.status === 204) return null
  return respuesta.json()
}
