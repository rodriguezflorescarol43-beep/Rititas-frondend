import { createRouter, createWebHistory } from 'vue-router'
import { RECURSOS } from './admin/recursos'
import { hayAdmin } from './composables/useAdmin'
import { NOMBRE } from './config'

const rutas = [
  { path: '/', name: 'inicio', component: () => import('./views/HomeView.vue'), meta: { titulo: 'Inicio' } },
  // Las convocatorias viven dentro de la universidad: Universidades > una universidad > una facultad.
  { path: '/universidades/:id(\\d+)', name: 'universidad', component: () => import('./views/UniversidadView.vue'), props: true, meta: { titulo: 'Universidad' } },
  { path: '/facultades/:id(\\d+)', name: 'facultad', component: () => import('./views/FacultadView.vue'), props: true, meta: { titulo: 'Facultad y convocatoria' } },
  // Direcciones viejas (enlaces guardados): llevan a la nueva ubicación.
  { path: '/convocatorias', redirect: '/universidades' },
  { path: '/convocatorias/:id(\\d+)', redirect: (to) => `/facultades/${to.params.id}` },
  { path: '/preuniversitario', name: 'preuniversitario', component: () => import('./views/PreuniversitarioView.vue'), meta: { titulo: 'Preuniversitario (institutos)' } },
  { path: '/preuniversitario/facultad/:tipo', name: 'preu-lista', component: () => import('./views/PreuniversitarioLista.vue'), props: true, meta: { titulo: 'Preuniversitarios' } },
  { path: '/preuniversitario/:id(\\d+)', name: 'preu-detalle', component: () => import('./views/PreuniversitarioDetalle.vue'), props: true, meta: { titulo: 'Preuniversitario' } },
  { path: '/embajadores', name: 'embajadores', component: () => import('./views/EmbajadoresView.vue'), meta: { titulo: 'Habla con quien ya estudia' } },
  { path: '/sin-senal', name: 'sin-senal', component: () => import('./views/SinSenalView.vue'), meta: { titulo: 'Usar sin señal' } },
  { path: '/universidades', name: 'universidades', component: () => import('./views/UniversidadesView.vue'), meta: { titulo: 'Universidades' } },
  { path: '/orientacion', name: 'orientacion', component: () => import('./views/OrientacionView.vue'), meta: { titulo: '¿No sabes qué estudiar?' } },
  { path: '/contacto', name: 'contacto', component: () => import('./views/ContactoView.vue'), meta: { titulo: 'Contacto' } },

  // Panel de administración: no aparece en el menú público y exige iniciar sesión.
  { path: '/admin/login', name: 'admin-login', component: () => import('./views/admin/AdminLogin.vue'), meta: { titulo: 'Entrar', sinMenu: true } },
  {
    path: '/admin',
    component: () => import('./views/admin/AdminLayout.vue'),
    meta: { admin: true, sinMenu: true },
    children: [
      { path: '', name: 'admin-resumen', component: () => import('./views/admin/AdminResumen.vue'), meta: { titulo: 'Resumen' } },
      { path: 'medios', component: () => import('./views/admin/AdminMedios.vue'), meta: { titulo: 'Imágenes y videos' } },
      { path: 'portada', component: () => import('./views/admin/AdminPortada.vue'), meta: { titulo: 'Portada' } },
      { path: 'mensajes', component: () => import('./views/admin/AdminMensajes.vue'), meta: { titulo: 'Mensajes' } },
      { path: 'revision', component: () => import('./views/admin/AdminRevision.vue'), meta: { titulo: 'Qué revisar hoy' } },
      { path: 'importar', component: () => import('./views/admin/AdminImportar.vue'), meta: { titulo: 'Importar propuesta' } },
      {
        path: ':recurso',
        name: 'admin-recurso',
        component: () => import('./views/admin/AdminRecurso.vue'),
        props: true,
        meta: { titulo: 'Administrar' },
        beforeEnter: (to) => (RECURSOS[to.params.recurso] ? true : '/admin'),
      },
    ],
  },

  { path: '/:resto(.*)*', name: 'no-encontrada', component: () => import('./views/NotFoundView.vue'), meta: { titulo: 'No encontrada' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes: rutas,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.matched.some((r) => r.meta.admin) && !hayAdmin.value) return '/admin/login'
  if (to.name === 'admin-login' && hayAdmin.value) return '/admin'
})

router.afterEach((to) => {
  const titulo = to.meta.titulo ?? 'Administración'
  document.title = to.meta.sinMenu ? `${titulo} · Administración` : `${titulo} · ${NOMBRE}`
})

export default router
