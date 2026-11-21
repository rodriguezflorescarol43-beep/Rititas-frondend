// Comprobación del sello digital del paquete (ECDSA P-256) con Web Crypto. No usa nada de Vue,
// así que también se puede probar con Node.

const aBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

// Web Crypto solo existe en páginas seguras (HTTPS o localhost).
export const puedeVerificar = () => typeof crypto !== 'undefined' && !!crypto.subtle

export async function verificar(paquete, clavePublicaB64) {
  const clave = await crypto.subtle.importKey(
    'spki',
    aBytes(clavePublicaB64),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    clave,
    aBytes(paquete.firma),
    new TextEncoder().encode(paquete.datos),
  )
}
