import { pedir } from './client'
import { salir, token } from '../composables/useAdmin'
import { actualizarPaquete } from '../datos/paquete'

// Todas las llamadas del panel llevan el token; si el servidor lo rechaza (401), se cierra la sesión.
// Después de guardar algo, se refresca el paquete de datos para que la página pública muestre el cambio.
async function admin(ruta, opciones = {}) {
  try {
    const respuesta = await pedir(`/admin${ruta}`, { ...opciones, token: token() })
    if (opciones.metodo && opciones.metodo !== 'GET') actualizarPaquete().catch(() => {})
    return respuesta
  } catch (e) {
    if (e.estado === 401) salir()
    throw e
  }
}

export const adminApi = {
  resumen: () => admin('/resumen'),
  listar: (recurso) => admin(`/${recurso}`),
  crear: (recurso, datos) => admin(`/${recurso}`, { metodo: 'POST', cuerpo: datos }),
  actualizar: (recurso, id, datos) => admin(`/${recurso}/${id}`, { metodo: 'PUT', cuerpo: datos }),
  borrar: (recurso, id) => admin(`/${recurso}/${id}`, { metodo: 'DELETE' }),

  mensajes: () => admin('/mensajes'),
  borrarMensaje: (id) => admin(`/mensajes/${id}`, { metodo: 'DELETE' }),

  medios: () => admin('/media'),
  subirMedio: (archivo) => {
    const datos = new FormData()
    datos.append('archivo', archivo)
    return admin('/media', { metodo: 'POST', archivo: datos })
  },
  borrarMedio: (id) => admin(`/media/${id}`, { metodo: 'DELETE' }),

  guardarAjustes: (datos) => admin('/ajustes', { metodo: 'PUT', cuerpo: datos }),

  // IA solo para el administrador: el Detective y la importación de propuestas.
  revision: () => admin('/revision'),
  referencias: () => admin('/referencias'),
  registro: () => admin('/registro'),
  analizarPropuesta: (propuesta) => admin('/propuestas/analizar', { metodo: 'POST', cuerpo: propuesta }),
  aplicarPropuesta: (propuesta, aprobados) =>
    admin('/propuestas/aplicar', { metodo: 'POST', cuerpo: { propuesta, aprobados } }),
  estadoIa: () => admin('/ia/estado'),
  ejemploIa: () => admin('/ia/ejemplo'),
  leerConIa: (archivo) => {
    const datos = new FormData()
    datos.append('archivo', archivo)
    return admin('/ia/leer', { metodo: 'POST', archivo: datos })
  },
  medirIa: (datos) => admin('/mediciones', { metodo: 'POST', cuerpo: datos }),
  mediciones: () => admin('/mediciones'),
}
