import { computed, ref } from 'vue'
import { pedir } from '../api/client'

// Sesión del administrador. Se guarda solo mientras la pestaña esté abierta (sessionStorage)
// y nunca se guarda la contraseña, solo el token que entrega el servidor.
const CLAVE = 'guia_admin'

function leer() {
  try {
    const datos = JSON.parse(sessionStorage.getItem(CLAVE))
    if (datos && datos.expira_en * 1000 > Date.now()) return datos
  } catch {
    /* sin almacenamiento disponible */
  }
  return null
}

const sesion = ref(leer())

export const hayAdmin = computed(() => !!sesion.value && sesion.value.expira_en * 1000 > Date.now())
export const token = () => sesion.value?.token

export async function entrar(password) {
  const datos = await pedir('/admin/login', { metodo: 'POST', cuerpo: { password } })
  sesion.value = datos
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(datos))
  } catch {
    /* la sesión sigue en memoria */
  }
}

export function salir() {
  sesion.value = null
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    /* nada que borrar */
  }
}
