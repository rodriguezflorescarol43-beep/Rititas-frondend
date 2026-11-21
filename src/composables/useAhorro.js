import { computed, ref } from 'vue'

// Modo ahorro de datos: no carga imágenes pesadas. Se activa solo si el teléfono avisa que la
// conexión es muy lenta o que el ahorro de datos está encendido, y la persona puede cambiarlo a mano.
const CLAVE = 'guia_ahorro'

const leerManual = () => {
  try {
    return localStorage.getItem(CLAVE) // 'si' | 'no' | null (automático)
  } catch {
    return null
  }
}

const conexion = typeof navigator !== 'undefined' ? navigator.connection : undefined
const detectar = () => !!(conexion && (conexion.saveData || ['slow-2g', '2g'].includes(conexion.effectiveType)))

const manual = ref(leerManual())
const automatico = ref(detectar())
conexion?.addEventListener?.('change', () => {
  automatico.value = detectar()
})

export const ahorro = computed(() => (manual.value === 'si' ? true : manual.value === 'no' ? false : automatico.value))
export const ahorroAutomatico = computed(() => automatico.value)
export const ahorroManual = computed(() => manual.value)

export function fijarAhorro(valor) {
  manual.value = valor
  try {
    if (valor === null) localStorage.removeItem(CLAVE)
    else localStorage.setItem(CLAVE, valor)
  } catch {
    /* sin almacenamiento: vale solo mientras la página está abierta */
  }
}
