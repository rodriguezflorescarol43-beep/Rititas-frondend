// Cambia aquí el nombre del proyecto y el menú: se usa en toda la app.
export const NOMBRE = 'Guía de ingreso'

export const MENU = [
  { to: '/', etiqueta: 'Inicio', icono: 'ti-home', exacto: true },
  { to: '/convocatorias', etiqueta: 'Convocatorias', icono: 'ti-calendar-event' },
  { to: '/preuniversitario', etiqueta: 'Preuniversitario', corta: 'Preuniv.', nota: '(institutos)', icono: 'ti-school' },
  { to: '/universidades', etiqueta: 'Universidades', icono: 'ti-building-community' },
  { to: '/orientacion', etiqueta: '¿No sabes qué estudiar?', icono: 'ti-help-circle' },
]

export const MENU_CONTACTO = { to: '/contacto', etiqueta: 'Contacto', icono: 'ti-mail' }
