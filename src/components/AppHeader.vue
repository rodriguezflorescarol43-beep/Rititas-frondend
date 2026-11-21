<script setup>
import { MENU, MENU_CONTACTO, NOMBRE } from '../config'
</script>

<template>
  <header class="no-print border-b-2 border-line bg-card">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
      <RouterLink to="/" class="flex items-center gap-2 font-display text-lg font-semibold text-brand" aria-label="Ir al inicio">
        <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M8 24 L17 9 L26 24" fill="none" stroke="#0B1B3A" stroke-width="2.5" stroke-linejoin="round" />
          <circle cx="8" cy="24" r="4.5" fill="#0B1B3A" />
          <circle cx="17" cy="9" r="4.5" fill="#1B6B4C" />
          <circle cx="26" cy="24" r="4.5" fill="#5BC78F" />
        </svg>
        {{ NOMBRE }}
      </RouterLink>

      <nav aria-label="Menú principal" class="hidden items-center gap-1 md:flex">
        <RouterLink
          v-for="item in MENU"
          :key="item.to"
          :to="item.to"
          class="flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-ink-soft hover:bg-brand-soft"
          active-class="bg-brand-soft !text-brand"
          :exact-active-class="item.exacto ? 'bg-brand-soft !text-brand' : ''"
        >
          <span>
            {{ item.etiqueta }}
            <small v-if="item.nota" class="block text-[11px] font-normal leading-none">{{ item.nota }}</small>
          </span>
        </RouterLink>
        <RouterLink
          :to="MENU_CONTACTO.to"
          class="flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-ink-soft hover:bg-brand-soft"
          active-class="bg-brand-soft !text-brand"
        >
          {{ MENU_CONTACTO.etiqueta }}
        </RouterLink>
      </nav>

      <RouterLink
        :to="MENU_CONTACTO.to"
        class="flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-bold text-brand md:hidden"
      >
        <i class="ti ti-mail text-xl" aria-hidden="true"></i> Contacto
      </RouterLink>
    </div>
  </header>
</template>
