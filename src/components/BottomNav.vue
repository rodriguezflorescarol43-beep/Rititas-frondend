<script setup>
import { MENU } from '../config'
</script>

<template>
  <nav
    aria-label="Menú principal"
    class="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t-2 border-line bg-card md:hidden"
  >
    <RouterLink
      v-for="item in MENU"
      :key="item.to"
      :to="item.to"
      :aria-label="item.nota ? `${item.etiqueta} ${item.nota}` : item.etiqueta"
      class="flex min-h-16 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center text-[11px] leading-tight text-ink-soft"
      active-class="bg-brand-soft font-bold !text-brand"
      :exact-active-class="item.exacto ? 'bg-brand-soft font-bold !text-brand' : ''"
    >
      <i class="ti text-2xl" :class="item.icono" aria-hidden="true"></i>
      <span aria-hidden="true">{{ item.corta ?? item.etiqueta }}</span>
      <small v-if="item.nota" class="text-[11px] font-normal" aria-hidden="true">{{ item.nota }}</small>
    </RouterLink>
  </nav>
</template>
