<script setup>
import { computed } from 'vue'
import { enlaceWhatsApp } from '../utils/geo'

// Todos los canales de contacto que tiene una universidad o un preuniversitario: sitio web, teléfono,
// WhatsApp y redes. Solo se muestran los que existen: nunca se inventa un enlace.
const props = defineProps({
  item: { type: Object, required: true },
  mensaje: { type: String, default: '' }, // texto con el que se abre WhatsApp
})

// «Teléfono 4501512» → «4501512» (para marcar con un toque).
const telefono = computed(() => (props.item.contacto || '').match(/\+?\d[\d\s-]{5,}\d/)?.[0].replace(/[\s-]/g, '') ?? null)

const canales = computed(() => {
  const i = props.item
  const lista = []
  if (i.contacto) lista.push({ clave: 'tel', texto: telefono.value ? `Llamar: ${telefono.value}` : i.contacto, icono: 'ti-phone', href: telefono.value ? `tel:${telefono.value}` : null })
  if (i.whatsapp) lista.push({ clave: 'wa', texto: 'WhatsApp', icono: 'ti-brand-whatsapp', href: enlaceWhatsApp(i.whatsapp, props.mensaje) })
  if (i.instagram) lista.push({ clave: 'ig', texto: 'Instagram', icono: 'ti-brand-instagram', href: i.instagram })
  if (i.facebook) lista.push({ clave: 'fb', texto: 'Facebook', icono: 'ti-brand-facebook', href: i.facebook })
  if (i.tiktok) lista.push({ clave: 'tt', texto: 'TikTok', icono: 'ti-brand-tiktok', href: i.tiktok })
  if (i.sitio_web) lista.push({ clave: 'web', texto: 'Sitio web', icono: 'ti-external-link', href: i.sitio_web })
  return lista
})
</script>

<template>
  <ul v-if="canales.length" class="flex flex-wrap gap-2" aria-label="Contacto y redes">
    <li v-for="c in canales" :key="c.clave">
      <a v-if="c.href" :href="c.href" :target="c.href.startsWith('http') ? '_blank' : undefined" rel="noopener" class="btn-ghost !min-h-10 !px-3 !py-1.5 text-sm">
        <i class="ti" :class="c.icono" aria-hidden="true"></i> {{ c.texto }}
      </a>
      <span v-else class="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-line px-3 py-1.5 text-sm font-bold">
        <i class="ti" :class="c.icono" aria-hidden="true"></i> {{ c.texto }}
      </span>
    </li>
  </ul>
</template>
