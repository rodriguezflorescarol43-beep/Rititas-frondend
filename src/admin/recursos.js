// Describe qué se puede administrar y qué campos tiene cada cosa.
// Agregar un campo o un recurso nuevo se hace aquí, sin tocar las pantallas.
//
// tipo: texto | url | numero | fecha | textarea | select | media
// nulo: si está vacío se envía null (campo opcional); si no, se envía texto vacío.

const AREAS = [
  ['salud', 'Salud'],
  ['tecnologia', 'Tecnología e ingeniería'],
  ['negocios', 'Negocios y administración'],
  ['social', 'Sociedad, derecho y educación'],
  ['arte', 'Arte y comunicación'],
  ['naturaleza', 'Naturaleza y agro'],
]

// Mantener igual que FACULTADES_TIPO en backend/app/models/entities.py.
const TIPOS_FACULTAD = [
  ['ciencias_tecnologia', 'Ciencias y Tecnología'],
  ['medicina', 'Medicina'],
  ['economicas', 'Ciencias Económicas'],
  ['juridicas', 'Ciencias Jurídicas'],
  ['arquitectura', 'Arquitectura'],
  ['odontologia', 'Odontología'],
  ['humanidades', 'Humanidades'],
  ['bioquimica', 'Bioquímica y Farmacia'],
]

const VERIFICACION = [
  { clave: 'fuente_url', etiqueta: 'Enlace de la fuente oficial', tipo: 'url', nulo: true, ayuda: 'Dónde confirmaste este dato (https://...).' },
  { clave: 'verificado_en', etiqueta: 'Fecha en que lo verificaste', tipo: 'fecha', nulo: true, ayuda: 'Sin fecha, la página lo muestra como «sin verificar».' },
]

export const RECURSOS = {
  universidades: {
    titulo: 'Universidades',
    singular: 'universidad',
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre' },
      { clave: 'sigla', etiqueta: 'Sigla' },
      { clave: 'tipo', etiqueta: 'Tipo', opciones: { publica: 'Pública', privada: 'Privada', tecnico: 'Técnica' } },
      { clave: 'ciudad', etiqueta: 'Ciudad' },
    ],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      { clave: 'sigla', etiqueta: 'Sigla', tipo: 'texto', requerido: true },
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: [['publica', 'Pública'], ['privada', 'Privada'], ['tecnico', 'Técnica']] },
      { clave: 'ciudad', etiqueta: 'Ciudad', tipo: 'texto', requerido: true },
      { clave: 'departamento', etiqueta: 'Departamento', tipo: 'texto', requerido: true },
      { clave: 'sitio_web', etiqueta: 'Sitio web oficial', tipo: 'url', nulo: true },
      { clave: 'imagen_url', etiqueta: 'Imagen', tipo: 'media', nulo: true, ayuda: 'Súbela primero en «Imágenes y videos».' },
      { clave: 'costo_mensual_bs', etiqueta: 'Costo estimado al mes (Bs)', tipo: 'numero', nulo: true },
      { clave: 'becas', etiqueta: 'Becas', tipo: 'textarea', nulo: true },
      ...VERIFICACION,
    ],
    dependencias: ['medios'],
  },
  facultades: {
    titulo: 'Facultades',
    singular: 'facultad',
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre' },
      { clave: 'universidad_id', etiqueta: 'Universidad', desde: 'universidades' },
      { clave: 'area', etiqueta: 'Área', opciones: Object.fromEntries(AREAS) },
    ],
    campos: [
      { clave: 'universidad_id', etiqueta: 'Universidad', tipo: 'select', requerido: true, desde: 'universidades' },
      { clave: 'nombre', etiqueta: 'Nombre de la facultad', tipo: 'texto', requerido: true },
      { clave: 'area', etiqueta: 'Área', tipo: 'select', requerido: true, opciones: AREAS },
    ],
    dependencias: ['universidades'],
  },
  carreras: {
    titulo: 'Carreras',
    singular: 'carrera',
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre' },
      { clave: 'facultad_id', etiqueta: 'Facultad', desde: 'facultades' },
      { clave: 'duracion_anios', etiqueta: 'Años' },
    ],
    campos: [
      { clave: 'facultad_id', etiqueta: 'Facultad', tipo: 'select', requerido: true, desde: 'facultades' },
      { clave: 'nombre', etiqueta: 'Nombre de la carrera', tipo: 'texto', requerido: true },
      { clave: 'area', etiqueta: 'Área (para el test vocacional)', tipo: 'select', requerido: true, opciones: AREAS },
      { clave: 'duracion_anios', etiqueta: 'Duración (años)', tipo: 'numero', requerido: true },
      { clave: 'descripcion', etiqueta: 'Descripción corta', tipo: 'textarea' },
    ],
    dependencias: ['facultades', 'universidades'],
  },
  convocatorias: {
    titulo: 'Convocatorias',
    singular: 'convocatoria',
    columnas: [
      { clave: 'titulo', etiqueta: 'Título' },
      { clave: 'facultad_id', etiqueta: 'Facultad', desde: 'facultades' },
      { clave: 'inscripcion_inicio', etiqueta: 'Abre', fecha: true },
      { clave: 'inscripcion_fin', etiqueta: 'Cierra', fecha: true },
    ],
    campos: [
      { clave: 'facultad_id', etiqueta: 'Facultad', tipo: 'select', requerido: true, desde: 'facultades' },
      { clave: 'titulo', etiqueta: 'Título', tipo: 'texto', requerido: true },
      { clave: 'inscripcion_inicio', etiqueta: 'Inscripción desde', tipo: 'fecha', requerido: true },
      { clave: 'inscripcion_fin', etiqueta: 'Inscripción hasta', tipo: 'fecha', requerido: true },
      { clave: 'fecha_examen', etiqueta: 'Fecha del examen', tipo: 'fecha', nulo: true },
      { clave: 'modalidad_ingreso', etiqueta: 'Cómo se ingresa', tipo: 'select', requerido: true, opciones: [['examen', 'Examen de ingreso'], ['preuniversitario', 'Preuniversitario'], ['ambos', 'Examen o preuniversitario']] },
      { clave: 'costo_inscripcion_bs', etiqueta: 'Costo de inscripción (Bs)', tipo: 'numero', nulo: true },
      { clave: 'requisitos', etiqueta: 'Requisitos', tipo: 'textarea' },
      ...VERIFICACION,
    ],
    dependencias: ['facultades', 'universidades'],
  },
  preuniversitarios: {
    titulo: 'Preuniversitarios (institutos)',
    singular: 'preuniversitario',
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre' },
      { clave: 'departamento', etiqueta: 'Departamento' },
      { clave: 'duracion_meses', etiqueta: 'Meses' },
      { clave: 'modalidad', etiqueta: 'Modalidad', opciones: { presencial: 'Presencial', virtual: 'Virtual', mixta: 'Mixta' } },
    ],
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: [['instituto', 'Instituto'], ['universidad', 'De una universidad']] },
      { clave: 'ciudad', etiqueta: 'Ciudad', tipo: 'texto', requerido: true },
      { clave: 'departamento', etiqueta: 'Departamento', tipo: 'texto', requerido: true },
      { clave: 'duracion_meses', etiqueta: 'Duración (meses)', tipo: 'numero', requerido: true },
      { clave: 'costo_bs', etiqueta: 'Costo (Bs)', tipo: 'numero', nulo: true },
      { clave: 'modalidad', etiqueta: 'Modalidad', tipo: 'select', requerido: true, opciones: [['presencial', 'Presencial'], ['virtual', 'Virtual'], ['mixta', 'Mixta']] },
      { clave: 'prepara_para', etiqueta: 'Prepara para', tipo: 'texto' },
      { clave: 'contacto', etiqueta: 'Contacto (teléfono o correo)', tipo: 'texto', nulo: true },
      { clave: 'zona', etiqueta: 'Zona o barrio', tipo: 'texto', nulo: true },
      { clave: 'descripcion', etiqueta: 'Descripción corta', tipo: 'textarea', nulo: true },
      { clave: 'facultades_tipos', etiqueta: 'Facultades para las que prepara', tipo: 'multi', opciones: TIPOS_FACULTAD },
      { clave: 'materias', etiqueta: 'Materias que cubre', tipo: 'texto', ayuda: 'Separadas por coma: Matemáticas, Física, Química' },
      { clave: 'direccion', etiqueta: 'Dirección', tipo: 'texto', nulo: true },
      { clave: 'referencia', etiqueta: 'Referencia para llegar', tipo: 'texto', nulo: true },
      { clave: 'latitud', etiqueta: 'Latitud', tipo: 'numero', paso: 'any', nulo: true, ayuda: 'Para «Cerca de mí» y «Cómo llegar». Se copia desde el mapa del teléfono.' },
      { clave: 'longitud', etiqueta: 'Longitud', tipo: 'numero', paso: 'any', nulo: true },
      { clave: 'whatsapp', etiqueta: 'WhatsApp', tipo: 'texto', nulo: true, ayuda: 'Solo números con el código del país, sin + ni espacios. Ejemplo: 59170000000' },
      { clave: 'facebook', etiqueta: 'Facebook', tipo: 'url', nulo: true },
      { clave: 'instagram', etiqueta: 'Instagram', tipo: 'url', nulo: true },
      { clave: 'tiktok', etiqueta: 'TikTok', tipo: 'url', nulo: true },
      { clave: 'imagen_url', etiqueta: 'Foto', tipo: 'media', nulo: true, ayuda: 'Súbela primero en «Imágenes y videos».' },
      ...VERIFICACION,
    ],
    dependencias: ['medios'],
  },
  embajadores: {
    titulo: 'Embajadores',
    singular: 'embajador',
    columnas: [
      { clave: 'nombre', etiqueta: 'Nombre' },
      { clave: 'universidad_id', etiqueta: 'Universidad', desde: 'universidades' },
      { clave: 'carrera', etiqueta: 'Carrera' },
      { clave: 'activo', etiqueta: 'Publicado', bool: true },
    ],
    campos: [
      { clave: 'universidad_id', etiqueta: 'Universidad', tipo: 'select', requerido: true, desde: 'universidades' },
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      { clave: 'carrera', etiqueta: 'Carrera que estudia', tipo: 'texto', requerido: true },
      { clave: 'mensaje', etiqueta: 'Mensaje para quien quiere entrar', tipo: 'textarea', nulo: true },
      { clave: 'whatsapp', etiqueta: 'WhatsApp', tipo: 'texto', nulo: true, ayuda: 'Solo números con el código del país. Es el contacto que se mostrará.' },
      { clave: 'mayor_de_edad', etiqueta: 'Es mayor de 18 años', tipo: 'bool' },
      { clave: 'consentimiento', etiqueta: 'Aceptó aparecer en la página (consentimiento)', tipo: 'bool' },
      { clave: 'consentimiento_fecha', etiqueta: 'Fecha del consentimiento', tipo: 'fecha', nulo: true },
      { clave: 'activo', etiqueta: 'Publicar en la página', tipo: 'bool', ayuda: 'Solo se puede publicar con mayoría de edad, consentimiento y su fecha.' },
    ],
    dependencias: ['universidades'],
  },
}

export const MENU_ADMIN = [
  { to: '/admin', etiqueta: 'Resumen', icono: 'ti-layout-dashboard', exacto: true },
  { to: '/admin/revision', etiqueta: 'Qué revisar hoy', icono: 'ti-checklist' },
  { to: '/admin/importar', etiqueta: 'Importar propuesta', icono: 'ti-file-import' },
  { to: '/admin/universidades', etiqueta: 'Universidades', icono: 'ti-building-community' },
  { to: '/admin/facultades', etiqueta: 'Facultades', icono: 'ti-books' },
  { to: '/admin/carreras', etiqueta: 'Carreras', icono: 'ti-certificate' },
  { to: '/admin/convocatorias', etiqueta: 'Convocatorias', icono: 'ti-calendar-event' },
  { to: '/admin/preuniversitarios', etiqueta: 'Preuniversitarios', icono: 'ti-school' },
  { to: '/admin/embajadores', etiqueta: 'Embajadores', icono: 'ti-users' },
  { to: '/admin/medios', etiqueta: 'Imágenes y videos', icono: 'ti-photo-video' },
  { to: '/admin/portada', etiqueta: 'Portada', icono: 'ti-home-edit' },
  { to: '/admin/mensajes', etiqueta: 'Mensajes', icono: 'ti-mail' },
]
