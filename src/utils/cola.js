// Cola de envíos: si la señal se corta al mandar un mensaje, se guarda en el teléfono y se envía
// sola cuando vuelve la señal (con reintentos). No se pierde nada y la persona no tiene que repetirlo.
import { ref } from 'vue'
import { api } from '../api/servicios'

const CLAVE = 'guia_cola'
const MAXIMO = 20
const CADA_MS = 30_000

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function guardar(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    /* sin almacenamiento: no se puede guardar */
  }
  pendientes.value = lista.length
}

export const pendientes = ref(leer().length)
export const enviandoCola = ref(false)

export function encolar(datos) {
  const lista = leer()
  if (lista.length >= MAXIMO) return false
  lista.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, datos, creado: Date.now() })
  guardar(lista)
  return true
}

// Envía uno por uno. Si falla por la señal, se detiene y deja el resto para el próximo intento.
export async function procesarCola() {
  if (enviandoCola.value || !leer().length) return
  enviandoCola.value = true
  try {
    for (const item of leer()) {
      try {
        await api.contacto(item.datos)
      } catch (e) {
        if (e.sinConexion || e.estado >= 500 || e.estado === 429) break
        // Error que no se arregla reintentando (datos inválidos): se descarta para no atascar la cola.
      }
      guardar(leer().filter((x) => x.id !== item.id))
    }
  } finally {
    enviandoCola.value = false
  }
}

export function iniciarCola() {
  procesarCola()
  window.addEventListener('online', procesarCola)
  setInterval(procesarCola, CADA_MS)
}
