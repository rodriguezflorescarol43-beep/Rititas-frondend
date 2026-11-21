import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useOnline() {
  const enLinea = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const actualizar = () => (enLinea.value = navigator.onLine)
  onMounted(() => {
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', actualizar)
    window.removeEventListener('offline', actualizar)
  })
  return { enLinea }
}
