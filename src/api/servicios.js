import { local } from '../datos/local'
import { hayPaquete } from '../datos/paquete'
import { pedir } from './client'

// Con el paquete de datos guardado en el celular, las pantallas se llenan al instante y sin pedir
// nada por la red (ideal con señal débil). Si todavía no hay paquete (primera visita), se pide al
// servidor como antes. Los envíos (contacto) siempre van al servidor.
const leer = (red, propio) => (...args) =>
  hayPaquete() ? Promise.resolve().then(() => propio(...args)) : red(...args)

export const api = {
  meta: leer(() => pedir('/meta'), local.meta),
  ajustes: leer(() => pedir('/ajustes'), local.ajustes),
  universidades: leer((params) => pedir('/universidades', { params }), local.universidades),
  facultades: leer((params) => pedir('/facultades', { params }), local.facultades),
  facultad: leer((id) => pedir(`/facultades/${id}`), local.facultad),
  convocatorias: leer((params) => pedir('/convocatorias', { params }), local.convocatorias),
  preuniversitarios: leer((params) => pedir('/preuniversitarios', { params }), local.preuniversitarios),
  preuniversitario: leer((id) => pedir(`/preuniversitarios/${id}`), local.preuniversitario),
  embajadores: leer(() => pedir('/embajadores'), local.embajadores),
  preguntas: leer(() => pedir('/orientacion/preguntas'), local.preguntas),
  resultado: leer((datos) => pedir('/orientacion/resultado', { metodo: 'POST', cuerpo: datos }), local.resultado),
  contacto: (datos) => pedir('/contacto', { metodo: 'POST', cuerpo: datos }),
}
