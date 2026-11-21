<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api/servicios'
import PageHeader from '../components/PageHeader.vue'
import { encolar, pendientes } from '../utils/cola'

const route = useRoute()
const sobre = String(route.query.sobre ?? '').slice(0, 80)
// Otras pantallas mandan aquí con un motivo, para que la persona no tenga que escribirlo todo.
const MOTIVOS = {
  preuniversitario: 'Quiero que agreguen este preuniversitario:\n',
  error: `Encontré un dato que cambió o está mal${sobre ? ` en «${sobre}»` : ''}:\n`,
  embajador: 'Quiero ser embajador o embajadora de mi universidad. Mi universidad y mi carrera son:\n',
}

const form = ref({ nombre: '', email: '', mensaje: MOTIVOS[route.query.asunto] ?? '' })
const errores = ref({})
const enviando = ref(false)
const enviado = ref(false)
const guardadoParaDespues = ref(false)
const errorEnvio = ref('')

function validar() {
  const e = {}
  if (form.value.nombre.trim().length < 2) e.nombre = 'Escribe tu nombre.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.value.email)) e.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.'
  if (form.value.mensaje.trim().length < 5) e.mensaje = 'Cuéntanos tu consulta (mínimo 5 letras).'
  errores.value = e
  return Object.keys(e).length === 0
}

async function enviar() {
  errorEnvio.value = ''
  if (!validar()) return
  enviando.value = true
  const datos = { ...form.value }
  try {
    await api.contacto(datos)
    enviado.value = true
    form.value = { nombre: '', email: '', mensaje: '' }
  } catch (e) {
    if (e.sinConexion) {
      // Sin señal: el mensaje se guarda en el teléfono y se envía solo cuando vuelva.
      if (encolar(datos)) {
        guardadoParaDespues.value = true
        form.value = { nombre: '', email: '', mensaje: '' }
      } else {
        errorEnvio.value = 'Ya tienes varios mensajes esperando señal. Intenta de nuevo cuando se envíen.'
      }
    } else {
      errorEnvio.value = e.message
    }
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <PageHeader
    titulo="Contacto"
    subtitulo="¿Encontraste un dato que cambió o quieres sumarte para mantener la información de tu universidad? Escríbenos."
  />

  <div v-if="enviado" role="status" class="card max-w-xl border-ok-fg bg-ok-bg text-ok-fg">
    <p class="font-bold"><i class="ti ti-circle-check" aria-hidden="true"></i> Mensaje enviado</p>
    <p>Gracias por escribirnos.</p>
    <button type="button" class="btn-ghost mt-3" @click="enviado = false">Enviar otro mensaje</button>
  </div>

  <div v-else-if="guardadoParaDespues" role="status" class="card max-w-xl border-warn-fg bg-warn-bg text-warn-fg">
    <p class="font-bold"><i class="ti ti-clock" aria-hidden="true"></i> Guardado en tu teléfono</p>
    <p>No hay señal ahora. Tu mensaje se enviará solo cuando vuelva la conexión. No necesitas hacer nada más.</p>
    <p class="mt-1 text-sm">Mensajes esperando señal: <strong>{{ pendientes }}</strong></p>
    <button type="button" class="btn-ghost mt-3" @click="guardadoParaDespues = false">Escribir otro mensaje</button>
  </div>

  <form v-else class="card max-w-xl space-y-4" novalidate @submit.prevent="enviar">
    <div>
      <label for="nombre" class="mb-1 block font-bold">Nombre</label>
      <input id="nombre" v-model="form.nombre" class="field" autocomplete="name" :aria-invalid="!!errores.nombre" aria-describedby="e-nombre" />
      <p id="e-nombre" role="alert" class="mt-1 text-sm font-bold text-bad-fg">{{ errores.nombre }}</p>
    </div>
    <div>
      <label for="email" class="mb-1 block font-bold">Correo electrónico</label>
      <input id="email" v-model="form.email" type="email" class="field" autocomplete="email" :aria-invalid="!!errores.email" aria-describedby="e-email" />
      <p id="e-email" role="alert" class="mt-1 text-sm font-bold text-bad-fg">{{ errores.email }}</p>
    </div>
    <div>
      <label for="mensaje" class="mb-1 block font-bold">Mensaje</label>
      <textarea id="mensaje" v-model="form.mensaje" rows="5" class="field" :aria-invalid="!!errores.mensaje" aria-describedby="e-mensaje"></textarea>
      <p id="e-mensaje" role="alert" class="mt-1 text-sm font-bold text-bad-fg">{{ errores.mensaje }}</p>
    </div>
    <p v-if="errorEnvio" role="alert" class="font-bold text-bad-fg">{{ errorEnvio }}</p>
    <p class="text-sm text-ink-soft">Usamos tu nombre y tu correo solo para responderte. Si no hay señal, tu mensaje se guarda y se envía solo después.</p>
    <button type="submit" class="btn-primary w-full" :aria-busy="enviando">
      {{ enviando ? 'Enviando…' : 'Enviar mensaje' }}
    </button>
  </form>
</template>
