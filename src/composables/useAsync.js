import { ref } from 'vue'

// Ejecuta una función asíncrona y expone sus tres estados: cargando, error y datos.
export function useAsync(funcion, { inmediato = true } = {}) {
  const datos = ref(null)
  const error = ref(null)
  const cargando = ref(false)

  async function ejecutar(...args) {
    cargando.value = true
    error.value = null
    try {
      datos.value = await funcion(...args)
    } catch (e) {
      error.value = e
    } finally {
      cargando.value = false
    }
  }

  if (inmediato) ejecutar()
  return { datos, error, cargando, ejecutar }
}
