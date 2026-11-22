// Ayudas para la parte de IA del panel: la instrucción para Claude, leer su respuesta y los nombres de campos.
// La IA solo la usa el administrador; el estudiante nunca la ve.
import { ref } from 'vue'
import { RECURSOS } from './recursos'

// La última propuesta revisada en «Importar con IA», para poder medirla después sin volver a pegarla.
export const ultimaImportacion = ref(null)

// Nombre amigable de un campo («inscripcion_fin» → «Inscripción hasta»).
export function etiquetaCampo(recurso, campo) {
  return RECURSOS[recurso]?.campos.find((c) => c.clave === campo)?.etiqueta ?? campo
}

export function camposDe(recurso) {
  return (RECURSOS[recurso]?.campos ?? []).filter((c) => !c.clave.endsWith('_id') && c.tipo !== 'media')
}

// Claude a veces responde con texto antes o después, o dentro de ```json … ```: se toma solo el objeto.
export function extraerJson(texto) {
  const inicio = texto.indexOf('{')
  const fin = texto.lastIndexOf('}')
  if (inicio === -1 || fin <= inicio) throw new Error('No encontré los datos en la respuesta. Copia la respuesta completa de Claude.')
  try {
    return JSON.parse(texto.slice(inicio, fin + 1))
  } catch {
    throw new Error('La respuesta está incompleta o mal copiada. Vuelve a copiar toda la respuesta de Claude.')
  }
}

const CAMPOS_TEXTO = `- universidades: nombre, sigla, tipo (publica | privada | tecnico), ciudad, departamento, sitio_web, costo_mensual_bs, becas, descripcion, contacto, facebook, instagram, tiktok
- facultades: nombre, area (salud | tecnologia | negocios | social | arte | naturaleza)
- carreras: nombre, area, duracion_anios (1 a 10), descripcion
- convocatorias: titulo, inscripcion_inicio, inscripcion_fin, fecha_examen, modalidad_ingreso (examen | preuniversitario | ambos), costo_inscripcion_bs, requisitos
- preuniversitarios: nombre, tipo (instituto | universidad), ciudad, departamento, duracion_meses, costo_bs, modalidad (presencial | virtual | mixta), prepara_para, contacto, zona, descripcion, direccion, materias, whatsapp`

// El texto que el administrador pega en Claude junto con el PDF o la foto.
export function instruccionParaClaude(referencias) {
  const resumen = {
    universidades: referencias.universidades.map((u) => ({ id: u.id, sigla: u.sigla, nombre: u.nombre })),
    facultades: referencias.facultades.map((f) => ({ id: f.id, nombre: f.nombre, universidad: f.universidad })),
    convocatorias: referencias.convocatorias.map((c) => ({ id: c.id, titulo: c.titulo, facultad_id: c.facultad_id })),
    preuniversitarios: referencias.preuniversitarios.map((p) => ({ id: p.id, nombre: p.nombre })),
  }
  return `Eres un asistente que copia datos de documentos oficiales de admisión universitaria de Bolivia.
Lee el documento adjunto (PDF o foto) y devuelve SOLO un bloque JSON, sin explicaciones.

REGLAS MUY IMPORTANTES
1. No inventes nada. Si un dato no está escrito en el documento, NO lo pongas.
2. Para cada dato, en "evidencia" copia la frase EXACTA del documento donde lo leíste, letra por letra.
3. Fechas en formato AAAA-MM-DD. Montos solo con números (150, no "Bs 150").
4. Si el dato ya existe en la lista de REFERENCIAS de abajo, usa "accion": "actualizar" con su "id"
   y pon en "datos" solo lo que cambia. Si no existe, usa "accion": "crear".
5. Para crear una convocatoria o carrera, di de qué universidad y facultad es en "referencias".

FORMATO
{
  "formato": 1,
  "origen": "Claude",
  "fuente": "enlace https del documento o nombre del archivo",
  "cambios": [
    {
      "accion": "crear",
      "recurso": "convocatorias",
      "referencias": { "universidad": "UMSS", "facultad": "Facultad de Medicina" },
      "datos": { "titulo": "...", "inscripcion_inicio": "2027-01-10", "inscripcion_fin": "2027-02-10" },
      "evidencia": { "titulo": "frase exacta", "inscripcion_inicio": "frase exacta", "inscripcion_fin": "frase exacta" },
      "confianza": "alta"
    }
  ]
}

"recurso" puede ser: universidades, facultades, carreras, convocatorias, preuniversitarios.
Campos permitidos:
${CAMPOS_TEXTO}

REFERENCIAS (lo que ya existe en la página, con su id):
${JSON.stringify(resumen)}`
}
