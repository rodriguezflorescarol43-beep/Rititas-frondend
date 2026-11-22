<script setup>
import { computed } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import { ahorro } from '../composables/useAhorro'

const { datos: abiertas } = useAsync(() => api.convocatorias({ estado: 'abierta' }))
const cantidad = computed(() => abiertas.value?.length ?? null)

// Título, texto, imagen y video de la portada se editan desde el panel de administración.
const { datos: ajustes } = useAsync(() => api.ajustes())
const portada = computed(() => ({
  titulo: ajustes.value?.portada_titulo || 'Tu camino a la universidad, claro y sin vueltas',
  texto: ajustes.value?.portada_texto || 'Fechas, costos y carreras en un solo lugar, aunque vivas lejos de la ciudad. Sin registro.',
  imagen: ahorro.value ? '' : ajustes.value?.portada_imagen || '', // con ahorro de datos no se carga la foto
  video: ajustes.value?.portada_video || '',
}))

// La ruta recorre el orden natural: descubrir → comparar → prepararse → inscribirse.
const PASOS = [
  { to: '/orientacion', icono: 'ti-compass', titulo: 'Descubre qué estudiar', texto: 'Un test corto y carreras que encajan contigo.', tono: 'bg-mint-soft text-night' },
  { to: '/universidades', icono: 'ti-building-community', titulo: 'Compara universidades', texto: 'Públicas, privadas y técnicas, con costos y becas.', tono: 'bg-brand-soft text-brand' },
  { to: '/preuniversitario', nota: '(institutos)', icono: 'ti-school', titulo: 'Prepárate', texto: 'Dónde estudiar antes del examen y cuánto cuesta.', tono: 'bg-night text-mint' },
  { to: '/universidades', icono: 'ti-calendar-event', titulo: 'Inscríbete a tiempo', texto: 'Entra a tu universidad y facultad para ver fechas y requisitos.', tono: 'bg-brand text-white' },
]
</script>

<template>
  <section
    class="aparece relative overflow-hidden rounded-3xl bg-night text-white"
    :style="portada.imagen ? { backgroundImage: `url(${portada.imagen})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
  >
    <div class="relative p-6 sm:p-10 sm:pr-48" :class="portada.imagen ? 'bg-night/80' : 'fondo-puntos'">
      <p class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
        <i class="ti ti-map-pin" aria-hidden="true"></i> Para quienes viven lejos de la ciudad
      </p>
      <h1 class="text-3xl leading-tight sm:text-5xl">{{ portada.titulo }}</h1>
      <p class="mt-4 max-w-xl text-lg text-white/90">{{ portada.texto }}</p>
      <RouterLink to="/orientacion" class="btn mt-6 bg-mint text-lg text-night hover:bg-mint-soft">
        <i class="ti ti-help-circle text-2xl" aria-hidden="true"></i>
        ¿No sabes qué estudiar?
      </RouterLink>

      <!-- Detalle decorativo: el logo de tres puntos convertido en camino. -->
      <svg class="absolute bottom-6 right-6 hidden sm:block" width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
        <path d="M20 125 C 40 70, 70 100, 75 50 S 110 40, 130 22" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" />
        <circle cx="20" cy="125" r="11" fill="#fff" />
        <circle cx="75" cy="50" r="11" fill="#5BC78F" />
        <circle cx="130" cy="22" r="11" fill="#A8EBC6" />
      </svg>
    </div>
  </section>

  <section v-if="portada.video" class="mt-5" aria-label="Video de presentación">
    <!-- Sin reproducción automática y sin precarga: no gasta los datos de quien no lo mira. -->
    <video :src="portada.video" class="w-full rounded-2xl bg-ink" controls preload="none"></video>
  </section>

  <RouterLink
    v-if="cantidad !== null"
    to="/universidades"
    class="card aparece sube mt-5 flex items-center gap-3 hover:border-brand"
    style="--i: 2"
  >
    <span class="rounded-full bg-ok-bg px-3 py-1 font-bold text-ok-fg" aria-hidden="true">✔</span>
    <span>
      <strong>{{ cantidad }}</strong>
      {{ cantidad === 1 ? 'convocatoria abierta' : 'convocatorias abiertas' }} ahora.
      <span class="font-bold text-brand underline">Ver cuáles</span>
    </span>
  </RouterLink>

  <h2 class="mb-4 mt-10 text-2xl">Tu ruta, paso a paso</h2>
  <ol class="grid gap-4 sm:grid-cols-4">
    <li v-for="(p, i) in PASOS" :key="p.to" class="aparece" :style="{ '--i': i + 3 }">
      <div class="flex items-center">
        <span class="grid size-12 shrink-0 place-items-center rounded-2xl text-2xl" :class="p.tono">
          <i class="ti" :class="p.icono" aria-hidden="true"></i>
        </span>
        <span v-if="i < PASOS.length - 1" class="ml-3 hidden h-0 flex-1 border-t-2 border-dashed border-line sm:block" aria-hidden="true"></span>
      </div>
      <RouterLink :to="p.to" class="sube card mt-3 block hover:border-brand">
        <p class="text-sm font-bold text-ink-soft">Paso {{ i + 1 }}</p>
        <h3 class="text-lg">
          {{ p.titulo }}
          <small v-if="p.nota" class="block text-sm font-normal text-ink-soft">{{ p.nota }}</small>
        </h3>
        <p class="mt-1 text-ink-soft">{{ p.texto }}</p>
      </RouterLink>
    </li>
  </ol>

  <div class="mt-8 grid gap-4 sm:grid-cols-2">
    <RouterLink to="/sin-senal" class="card sube aparece flex items-start gap-3 hover:border-brand" style="--i: 7">
      <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-night text-2xl text-mint"><i class="ti ti-wifi-2" aria-hidden="true"></i></span>
      <span>
        <span class="block text-lg font-bold">Pensada para señal débil</span>
        <span class="text-ink-soft">Se guarda en tu teléfono, carga rápido y sigue funcionando sin señal. Mira cómo.</span>
      </span>
    </RouterLink>
    <RouterLink to="/embajadores" class="card sube aparece flex items-start gap-3 hover:border-brand" style="--i: 8">
      <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-mint-soft text-2xl text-night"><i class="ti ti-users" aria-hidden="true"></i></span>
      <span>
        <span class="block text-lg font-bold">Habla con alguien que ya estudia</span>
        <span class="text-ink-soft">Estudiantes voluntarios te cuentan cómo es el examen y la vida en su universidad.</span>
      </span>
    </RouterLink>
  </div>

  <ul class="mt-6 grid gap-3 text-sm text-ink-soft sm:grid-cols-3">
    <li class="card"><i class="ti ti-user-off text-brand" aria-hidden="true"></i> No necesitas crear una cuenta.</li>
    <li class="card"><i class="ti ti-lock text-brand" aria-hidden="true"></i> Tus respuestas del test se calculan en tu teléfono.</li>
    <li class="card"><i class="ti ti-circle-check text-brand" aria-hidden="true"></i> Cada dato muestra su fuente y su fecha.</li>
  </ul>
</template>
