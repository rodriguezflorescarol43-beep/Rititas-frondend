<script setup>
import { computed, watch } from 'vue'
import { api } from '../api/servicios'
import { useAsync } from '../composables/useAsync'
import { ahorro } from '../composables/useAhorro'
import AsyncState from '../components/AsyncState.vue'
import VerifiedTag from '../components/VerifiedTag.vue'
import { bs, MODALIDAD_PRE } from '../utils/format'
import { enlaceMapa, enlaceWhatsApp } from '../utils/geo'

const props = defineProps({ id: { type: String, required: true } })
const { datos: p, error, cargando, ejecutar } = useAsync(() => api.preuniversitario(props.id))
const { datos: meta } = useAsync(() => api.meta())
watch(() => props.id, () => ejecutar())

const lista = (texto) => (texto || '').split(',').map((t) => t.trim()).filter(Boolean)
const facultades = computed(() => lista(p.value?.facultades_tipos).map((c) => meta.value?.facultades_tipo?.[c]?.nombre ?? c))
const materias = computed(() => lista(p.value?.materias))
const modalidad = computed(() => (p.value?.modalidad === 'mixta' ? 'Presencial y virtual' : MODALIDAD_PRE[p.value?.modalidad]))
const redes = computed(() =>
  [
    ['facebook', 'Facebook', 'ti-brand-facebook'],
    ['instagram', 'Instagram', 'ti-brand-instagram'],
    ['tiktok', 'TikTok', 'ti-brand-tiktok'],
  ].filter(([clave]) => p.value?.[clave]),
)
const esTelefono = computed(() => /^[+\d][\d\s-]{6,}$/.test(p.value?.contacto ?? ''))
const tieneUbicacion = computed(() => !!(p.value?.direccion || (p.value?.latitud != null && p.value?.longitud != null)))
</script>

<template>
  <RouterLink :to="`/preuniversitario/facultad/${(p?.facultades_tipos || '').split(',')[0] || 'todos'}`" class="mb-4 inline-flex min-h-11 items-center gap-1 font-bold text-brand underline">
    <i class="ti ti-arrow-left" aria-hidden="true"></i> Volver a la lista
  </RouterLink>

  <AsyncState :cargando="cargando" :error="error" @reintentar="ejecutar">
    <article v-if="p" class="space-y-6">
      <img v-if="p.imagen_url && !ahorro" :src="p.imagen_url" :alt="`Foto de ${p.nombre}`" class="aparece h-48 w-full rounded-2xl object-cover sm:h-64" loading="lazy" />
      <div v-else class="aparece grid h-40 w-full place-items-center rounded-2xl bg-off-bg text-ink-soft" aria-hidden="true">
        <span class="flex items-center gap-2"><i class="ti ti-photo text-2xl"></i> Foto del preuniversitario</span>
      </div>

      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl sm:text-3xl">{{ p.nombre }}</h1>
          <p v-if="p.descripcion" class="mt-1 text-lg text-ink-soft">{{ p.descripcion }}</p>
        </div>
        <span v-if="p.verificado_en" class="inline-flex items-center gap-1.5 rounded-full bg-ok-bg px-3 py-1 text-sm font-bold text-ok-fg">✔ Verificado</span>
        <span v-else class="inline-flex items-center gap-1.5 rounded-full bg-warn-bg px-3 py-1 text-sm font-bold text-warn-fg">◆ Sin verificar</span>
      </header>

      <dl class="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div class="rounded-xl bg-off-bg p-3"><dt class="text-sm text-ink-soft">Zona</dt><dd class="text-lg font-bold">{{ p.zona || p.ciudad }}</dd></div>
        <div class="rounded-xl bg-off-bg p-3"><dt class="text-sm text-ink-soft">Modalidad</dt><dd class="text-lg font-bold">{{ modalidad }}</dd></div>
        <div class="rounded-xl bg-off-bg p-3"><dt class="text-sm text-ink-soft">Prepara para</dt><dd class="text-lg font-bold">{{ facultades.length }} {{ facultades.length === 1 ? 'facultad' : 'facultades' }}</dd></div>
        <div class="rounded-xl bg-off-bg p-3"><dt class="text-sm text-ink-soft">Atiende por</dt><dd class="text-lg font-bold">{{ p.whatsapp ? 'WhatsApp' : p.contacto ? 'Teléfono' : 'Por confirmar' }}</dd></div>
        <div class="rounded-xl bg-off-bg p-3"><dt class="text-sm text-ink-soft">Dura</dt><dd class="text-lg font-bold">{{ p.duracion_meses }} meses</dd></div>
        <div class="rounded-xl bg-off-bg p-3"><dt class="text-sm text-ink-soft">Costo</dt><dd class="text-lg font-bold">{{ bs(p.costo_bs) }}</dd></div>
      </dl>

      <section v-if="facultades.length" aria-labelledby="d-fac">
        <h2 id="d-fac" class="mb-2 text-lg">Facultades para las que prepara</h2>
        <ul class="flex flex-wrap gap-2"><li v-for="f in facultades" :key="f" class="rounded-full bg-brand-soft px-4 py-1.5 font-bold text-brand">{{ f }}</li></ul>
      </section>

      <section v-if="materias.length" aria-labelledby="d-mat">
        <h2 id="d-mat" class="mb-2 text-lg">Materias que cubre</h2>
        <ul class="flex flex-wrap gap-2"><li v-for="m in materias" :key="m" class="rounded-full bg-mint-soft px-4 py-1.5 font-bold text-night">{{ m }}</li></ul>
      </section>

      <section v-if="tieneUbicacion" aria-labelledby="d-ubi">
        <h2 id="d-ubi" class="mb-2 text-lg">Ubicación</h2>
        <p class="flex items-start gap-2">
          <i class="ti ti-map-pin mt-1 text-brand" aria-hidden="true"></i>
          <span>{{ [p.direccion, p.ciudad].filter(Boolean).join(', ') }}<span v-if="p.referencia" class="block text-ink-soft">{{ p.referencia }}</span></span>
        </p>
        <a :href="enlaceMapa(p)" target="_blank" rel="noopener" class="btn-ghost mt-3">
          <i class="ti ti-route" aria-hidden="true"></i> Cómo llegar
        </a>
        <p class="mt-1 text-sm text-ink-soft">Se abre en el mapa de tu teléfono. Así la página no gasta tus datos en un mapa.</p>
      </section>

      <section v-if="p.whatsapp || esTelefono" aria-labelledby="d-con" class="flex flex-wrap gap-3">
        <h2 id="d-con" class="sr-only">Contacto</h2>
        <a v-if="p.whatsapp" :href="enlaceWhatsApp(p.whatsapp, `Hola, vi ${p.nombre} en la página y quiero información.`)" target="_blank" rel="noopener" class="btn-primary">
          <i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Escribir por WhatsApp
        </a>
        <a v-if="esTelefono" :href="`tel:${p.contacto.replace(/\s/g, '')}`" class="btn-ghost">
          <i class="ti ti-phone" aria-hidden="true"></i> Llamar: {{ p.contacto }}
        </a>
      </section>

      <section v-if="redes.length" aria-labelledby="d-red">
        <h2 id="d-red" class="mb-2 text-lg">Redes sociales</h2>
        <ul class="flex flex-wrap gap-2">
          <li v-for="[clave, nombre, icono] in redes" :key="clave">
            <a :href="p[clave]" target="_blank" rel="noopener" class="btn-ghost !py-2"><i class="ti" :class="icono" aria-hidden="true"></i> {{ nombre }}</a>
          </li>
        </ul>
      </section>

      <VerifiedTag :verificado="p.verificado_en" :fuente="p.fuente_url" />
      <p class="text-sm text-ink-soft">
        ¿Algún dato está mal?
        <RouterLink :to="{ path: '/contacto', query: { asunto: 'error', sobre: p.nombre } }" class="font-bold text-brand underline">Avísanos</RouterLink>.
      </p>
    </article>
  </AsyncState>
</template>
