<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { entrar } from '../../composables/useAdmin'
import { NOMBRE } from '../../config'

const router = useRouter()
const password = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  if (!password.value) {
    error.value = 'Escribe la contraseña.'
    return
  }
  cargando.value = true
  try {
    await entrar(password.value)
    password.value = ''
    router.push('/admin')
  } catch (e) {
    error.value = e.sinConexion ? 'No hay conexión con el servidor.' : e.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
    <div class="mb-6 text-center">
      <i class="ti ti-lock-square-rounded text-5xl text-brand" aria-hidden="true"></i>
      <h1 class="mt-2 text-2xl">Administración</h1>
      <p class="text-ink-soft">{{ NOMBRE }}</p>
    </div>
    <form class="card space-y-4" novalidate @submit.prevent="enviar">
      <div>
        <label for="clave" class="mb-1 block font-bold">Contraseña de administrador</label>
        <input id="clave" v-model="password" type="password" class="field" autocomplete="current-password" :aria-invalid="!!error" aria-describedby="e-clave" />
        <p id="e-clave" role="alert" class="mt-1 min-h-6 text-sm font-bold text-bad-fg">{{ error }}</p>
      </div>
      <button type="submit" class="btn-primary w-full" :aria-busy="cargando">
        {{ cargando ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
    <RouterLink to="/" class="mt-6 text-center font-bold text-brand underline">Volver a la página</RouterLink>
  </main>
</template>
