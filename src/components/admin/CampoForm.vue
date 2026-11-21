<script setup>
import { computed } from 'vue'

// Un campo de formulario del panel. El tipo viene de admin/recursos.js.
// tipo: texto | url | numero | fecha | textarea | select | media | bool | multi
const props = defineProps({
  campo: { type: Object, required: true },
  modelValue: { default: '' },
  opciones: { type: Array, default: () => [] }, // [[valor, etiqueta], ...]
  imagenes: { type: Array, default: () => [] }, // [{ url, nombre }]
})
const emit = defineEmits(['update:modelValue'])

const id = computed(() => `campo-${props.campo.clave}`)
const valor = computed({
  get: () => props.modelValue ?? '',
  set: (v) => emit('update:modelValue', v),
})
const TIPOS_INPUT = { texto: 'text', url: 'url', numero: 'number', fecha: 'date' }

// «multi» guarda las claves elegidas separadas por coma.
const elegidos = computed(() => String(props.modelValue || '').split(',').filter(Boolean))
function alternar(clave) {
  const lista = new Set(elegidos.value)
  if (lista.has(clave)) lista.delete(clave)
  else lista.add(clave)
  emit('update:modelValue', [...lista].join(','))
}
</script>

<template>
  <div :class="campo.tipo === 'textarea' || campo.tipo === 'multi' ? 'sm:col-span-2' : ''">
    <label v-if="campo.tipo !== 'bool' && campo.tipo !== 'multi'" :for="id" class="mb-1 block font-bold">
      {{ campo.etiqueta }}
      <span v-if="campo.requerido" class="font-normal text-ink-soft">(obligatorio)</span>
    </label>
    <p v-else-if="campo.tipo === 'multi'" :id="id" class="mb-1 font-bold">{{ campo.etiqueta }}</p>

    <select v-if="campo.tipo === 'select'" :id="id" v-model="valor" class="field">
      <option v-if="campo.requerido" value="" disabled>Elige una opción</option>
      <option v-else value="">Sin elegir</option>
      <option v-for="[v, texto] in opciones" :key="v" :value="v">{{ texto }}</option>
    </select>

    <template v-else-if="campo.tipo === 'media'">
      <select :id="id" v-model="valor" class="field">
        <option value="">Sin imagen</option>
        <option v-for="img in imagenes" :key="img.url" :value="img.url">{{ img.nombre }}</option>
      </select>
      <img v-if="valor" :src="valor" alt="Vista previa de la imagen elegida" class="mt-2 h-28 rounded-xl border-2 border-line object-cover" />
    </template>

    <label v-else-if="campo.tipo === 'bool'" class="flex items-center gap-3">
      <input :id="id" v-model="valor" type="checkbox" class="size-6 accent-brand" />
      <span class="font-bold">{{ campo.etiqueta }}</span>
    </label>

    <fieldset v-else-if="campo.tipo === 'multi'" :aria-labelledby="id" class="flex flex-wrap gap-2">
      <label
        v-for="[v, texto] in campo.opciones"
        :key="v"
        class="chip cursor-pointer"
        :aria-pressed="elegidos.includes(v)"
        :class="elegidos.includes(v) ? '!border-brand !bg-brand !text-white' : ''"
      >
        <input type="checkbox" class="sr-only" :checked="elegidos.includes(v)" @change="alternar(v)" />
        {{ texto }}
      </label>
    </fieldset>

    <textarea v-else-if="campo.tipo === 'textarea'" :id="id" v-model="valor" rows="3" class="field"></textarea>

    <input
      v-else
      :id="id"
      v-model="valor"
      :type="TIPOS_INPUT[campo.tipo] ?? 'text'"
      :min="campo.tipo === 'numero' && !campo.paso ? 0 : undefined"
      :step="campo.paso"
      :required="campo.requerido"
      class="field"
    />

    <p v-if="campo.ayuda" class="mt-1 text-sm text-ink-soft">{{ campo.ayuda }}</p>
  </div>
</template>
