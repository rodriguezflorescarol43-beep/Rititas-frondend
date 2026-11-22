// Cambia aquí el nombre del proyecto y el menú: se usa en toda la app.
export const NOMBRE = 'Despega'
// Lo que la página es, en pocas palabras (se ve junto al nombre y en el título de la pestaña).
export const SUBTITULO = 'Guía de ingreso'

export const MENU = [
  // `nota` es la palabra pequeña que explica la sección (se ve en el menú del celular y en el de escritorio).
  { to: '/', etiqueta: 'Inicio', nota: '(empezar)', icono: 'ti-home', exacto: true },
  { to: '/preuniversitario', etiqueta: 'Preuniversitario', corta: 'Preuniv.', nota: '(institutos)', icono: 'ti-school' },
  { to: '/universidades', etiqueta: 'Universidades', nota: '(convocatorias)', icono: 'ti-building-community' },
  { to: '/orientacion', etiqueta: '¿No sabes qué estudiar?', corta: '¿Qué estudiar?', nota: '(test)', icono: 'ti-help-circle' },
]

// Esta página es de prueba y solo cubre Cochabamba: los filtros por departamento ofrecen solo esta opción.
export const DEPARTAMENTOS = ['Cochabamba']

export const MENU_CONTACTO = { to: '/contacto', etiqueta: 'Contacto', icono: 'ti-mail' }
