// El «paquete de datos»: todo el catálogo en un solo archivo firmado, guardado en el celular.
// Una sola petición alcanza para navegar, calcular el test y ver convocatorias sin pedir nada más.
import { reactive } from 'vue'
import { pedir } from '../api/client'
import { puedeVerificar, verificar } from './firma.js'

const CLAVE_PAQUETE = 'guia_paquete'
const CLAVE_PUBLICA = 'guia_clave'
const CADA_MS = 10 * 60 * 1000

// Estado visible para la interfaz (pie de página, importar archivo).
export const estadoPaquete = reactive({ version: null, actualizando: false, error: '', revisadoEn: null })

let memo // undefined = aún no se leyó; null = no hay paquete

function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE_PAQUETE)
    if (!crudo) return null
    const p = JSON.parse(crudo)
    return { ...p, datosObj: JSON.parse(p.datos) }
  } catch {
    return null
  }
}

export function paqueteActual() {
  if (memo === undefined) {
    memo = leer()
    estadoPaquete.version = memo?.version ?? null
  }
  return memo
}
export const hayPaquete = () => !!paqueteActual()
export const datosDelPaquete = () => paqueteActual()?.datosObj ?? null

function guardar(p) {
  const guardado = { formato: p.formato, version: p.version, datos: p.datos, firma: p.firma }
  try {
    localStorage.setItem(CLAVE_PAQUETE, JSON.stringify(guardado))
  } catch {
    /* sin espacio o sin almacenamiento: el paquete queda solo en memoria */
  }
  memo = { ...guardado, datosObj: JSON.parse(p.datos) }
  estadoPaquete.version = p.version
}

const claveGuardada = () => {
  try {
    return localStorage.getItem(CLAVE_PUBLICA)
  } catch {
    return null
  }
}

async function traerClave() {
  const { clave_publica: clave } = await pedir('/paquete/clave')
  try {
    localStorage.setItem(CLAVE_PUBLICA, clave)
  } catch {
    /* se vuelve a pedir la próxima vez */
  }
  return clave
}

// Pide el paquete al servidor. Si no cambió, el servidor responde 304 y casi no gasta datos.
export async function actualizarPaquete() {
  if (estadoPaquete.actualizando) return false
  estadoPaquete.actualizando = true
  estadoPaquete.error = ''
  try {
    const p = await pedir('/paquete')
    if (puedeVerificar()) {
      let clave = claveGuardada() ?? (await traerClave())
      let ok = await verificar(p, clave)
      if (!ok) {
        clave = await traerClave() // por si el servidor cambió de clave
        ok = await verificar(p, clave)
      }
      if (!ok) throw new Error('El paquete no tiene una firma válida')
    }
    estadoPaquete.revisadoEn = new Date().toISOString()
    const actual = paqueteActual()
    if (actual && actual.version > p.version) return false // ya hay datos más nuevos (por ejemplo, recibidos por archivo)
    const cambio = !actual || actual.datos !== p.datos
    if (cambio) guardar(p)
    return cambio
  } catch (e) {
    estadoPaquete.error = e.message
    throw e
  } finally {
    estadoPaquete.actualizando = false
  }
}

export function iniciarPaquete() {
  const revisar = () => actualizarPaquete().catch(() => {})
  revisar()
  window.addEventListener('online', revisar)
  setInterval(revisar, CADA_MS)
}

// ---------- Compartir por archivo (por ejemplo, por WhatsApp) ----------

export function archivoParaCompartir() {
  const p = paqueteActual()
  if (!p) return null
  const texto = JSON.stringify({ formato: p.formato, version: p.version, datos: p.datos, firma: p.firma })
  const nombre = `guia-datos-${p.version.slice(0, 10)}.json`
  return { nombre, texto, archivo: new File([texto], nombre, { type: 'application/json' }) }
}

// Comprueba el sello con la clave guardada y solo acepta datos más nuevos que los que ya hay.
export async function importarArchivo(texto) {
  let p
  try {
    p = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es un paquete de datos válido.')
  }
  if (p?.formato !== 1 || typeof p.datos !== 'string' || typeof p.firma !== 'string' || typeof p.version !== 'string') {
    throw new Error('El archivo no es un paquete de datos válido.')
  }
  if (!puedeVerificar()) {
    throw new Error('Tu navegador solo puede comprobar el sello en una página segura (HTTPS).')
  }
  const clave = claveGuardada()
  if (!clave) {
    throw new Error('Primero abre la página con conexión una vez, para guardar la clave que comprueba el sello.')
  }
  let ok = false
  try {
    ok = await verificar(p, clave)
  } catch {
    ok = false
  }
  if (!ok) throw new Error('El sello no coincide: el archivo fue alterado o no viene de esta página. No se usó.')
  let datos
  try {
    datos = JSON.parse(p.datos)
  } catch {
    throw new Error('El archivo no es un paquete de datos válido.')
  }
  if (datos.version !== p.version) throw new Error('El archivo es inconsistente. No se usó.')
  const actual = paqueteActual()
  if (actual && p.version <= actual.version) {
    throw new Error(`Ya tienes datos iguales o más recientes (del ${actual.version.slice(0, 10)}).`)
  }
  guardar(p)
  return p.version
}
