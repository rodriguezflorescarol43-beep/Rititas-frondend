# Guía de ingreso · Frontend (PWA)

**Abstracthon 2026.** Página web para quienes terminan el colegio en zonas alejadas (provincias) y no saben **qué
estudiar**, **qué preuniversitarios existen** ni **cuándo son las convocatorias**. Pensada para **señal débil**, sin
registro y que funciona **sin señal**.

Este repositorio es el **frontend**: la página que ve el estudiante (y la pantalla del panel de administración). La API
y la base de datos están en el repositorio del backend.

| Parte | Repositorio |
|---|---|
| **Frontend** (este) | https://github.com/rodriguezflorescarol43-beep/hackaton2026-oficial |
| **Backend** (API y panel) | https://github.com/rodriguezflorescarol43-beep/backend-hackaton |

## El problema y la solución

**Problema.** Quien sale del colegio en una provincia suele no saber qué estudiar, no conoce los preuniversitarios
(institutos) ni las fechas de ingreso, que están dispersas en PDFs de cada universidad, y además tiene señal débil
o intermitente.

**Solución.** Una guía web instalable (PWA) que reúne todo en un solo lugar y funciona con poca señal.

**Menú:** Inicio · Convocatorias · Preuniversitario (institutos) · Universidades · ¿No sabes qué estudiar? · Contacto.

## Qué hace

| Sección | Contenido |
|---|---|
| **Convocatorias** | Facultades por universidad. Al entrar a una facultad se abre su convocatoria: fechas, requisitos, costo, carreras y botón para guardar las fechas en el calendario (con alarma un día antes) |
| **Preuniversitario (institutos)** | Elegir la **facultad** → lista con filtros (Presencial, Virtual, **Cerca de mí**) → detalle con zona, materias, «Cómo llegar», WhatsApp y redes |
| **Universidades** | Públicas, privadas y técnicas, con costo estimado, becas y enlace a sus facultades |
| **¿No sabes qué estudiar?** | Condiciones → test de 8 preguntas → carreras recomendadas **con el motivo explicado**, **Plan A, B y C**, costo estimado del primer año y simulador «¿y si…?» |
| **Embajadores** | Estudiantes voluntarios (mayores de 18 años, con consentimiento) que cuentan cómo es su universidad |
| **Usar sin señal** | Estado de los datos guardados, modo ahorro, y **pasar los datos por WhatsApp** con sello digital |
| **Contacto** | Formulario; si no hay señal, el mensaje se guarda y se envía solo al volver |
| **Escuchar** | Lee la pantalla en voz alta con la voz del teléfono (necesita una voz en español instalada) |

Cada dato muestra su **fuente** y su **fecha de verificación**. Si no está verificado, la página lo dice:
«Dato de ejemplo · sin verificar».

## Pensada para señal débil (no solo «sin internet»)

Con poca señal hay tres problemas: el **peso** de la primera visita, la **latencia** de cada petición y los **cortes**.

| Problema | Qué hace la página | Dónde |
|---|---|---|
| Peso | Fuentes solo en letras latinas, **iconos recortados a los 94 que se usan (14 KB en vez de 528 KB)**, compresión en el servidor | `src/main.js`, `scripts/subset_iconos.py` |
| Latencia | Descarga **un solo archivo** con todo el catálogo (~17 KB) y lo guarda en el teléfono. Las pantallas se llenan sin pedir nada por la red | `src/datos/` |
| Cortes | Si los datos no cambiaron, el servidor responde 304 sin cuerpo. Los mensajes escritos sin señal se guardan y se envían solos | `src/utils/cola.js` |
| Datos viejos | El estado de las convocatorias se calcula **en el teléfono** con la fecha de hoy, aunque los datos se hayan guardado hace días | `src/datos/estado.js` |
| Datos pesados | **Modo ahorro** (automático o manual): no carga fotos; el video de la portada no se reproduce solo | `src/composables/useAhorro.js` |

**Medido en esta versión** (compilación de producción, **sin** red lenta simulada):

| | Antes | Ahora |
|---|---|---|
| Archivos de la primera visita | 91 | **47** |
| Peso sin comprimir | 1.400 KB | **406 KB** |
| Enviado por la red (con compresión) | ~1.400 KB | **~246 KB** |
| Fuentes | 51 archivos, 804 KB | **5 archivos, 77 KB** |
| Catálogo completo | varias peticiones | **1 archivo de ~17 KB** |

> Son cifras de la compilación, no de un celular real con red lenta. Mídelas con Lighthouse en «Slow 4G» antes de
> presentarlas como logro.

### El test corre en el teléfono
El motor de orientación (`src/datos/motor.js`) calcula **en el teléfono**, así que funciona sin señal y las respuestas
no se envían a ningún servidor. Una prueba automática del repositorio del backend comprueba que da **exactamente lo
mismo** que el del servidor.

### Paquete de datos firmado
Los datos viajan en un paquete **firmado (ECDSA P-256)**. La página comprueba el sello con Web Crypto antes de aceptar
un archivo recibido por WhatsApp: rechaza lo alterado y lo más viejo que lo que ya tiene. Requiere **HTTPS** (o
`localhost`).

## PWA

1. Abre la página **una vez con conexión**: se guarda la aplicación completa y el paquete de datos.
2. Después navega **sin internet**, incluso por pantallas que nunca abriste.
3. En el celular, el navegador ofrece «Instalar» o «Agregar a la pantalla de inicio».

Para instalarla en un celular real debe servirse por **HTTPS**.

## Tecnología

Vue 3 · Vue Router · Tailwind CSS 4 · Vite · `vite-plugin-pwa` (Workbox) · fuentes Atkinson Hyperlegible y Lexend
(`@fontsource`) · iconos Tabler recortados.

```text
src/
  api/            Cliente de la API (único lugar que hace fetch) y llamadas del panel
  datos/          Paquete firmado, motor del test, estado de convocatorias, repositorio local
  composables/    Estado compartido (cargando, conexión, sesión del administrador, modo ahorro)
  components/     Piezas reutilizables
  views/          Una pantalla por ruta (y views/admin/ para el panel)
  utils/          Fechas, calendario .ics, compartir por WhatsApp, ubicación, cola de envíos
  admin/          Descripción de qué se puede administrar y sus campos
scripts/          subset_iconos.py (recorta la fuente de iconos)
public/           Iconos de la PWA y fuente de iconos recortada
```

## Cómo correrlo

Necesitas **Node 20+** y el **backend** (Python) corriendo en el puerto 8000.

### Desarrollo (recarga en vivo)

```powershell
# 1. Backend, en otra terminal: sigue las instrucciones de su repositorio
#    https://github.com/rodriguezflorescarol43-beep/backend-hackaton
# 2. Este frontend
npm install
npm run dev          # http://localhost:5173  (las llamadas a /api se envían al backend en :8000)
```

El service worker (PWA) **solo funciona en la versión compilada**.

### Compilar y servir con el backend

```powershell
npm run build        # genera dist/
```

Clona este repositorio **dentro** de la carpeta del backend con el nombre `frontend` y el backend entrega la página
compilada en `/` y la API en `/api`, todo en un solo servidor (http://localhost:8000).

### Iconos

Si agregas un icono nuevo, corre `npm run iconos` (necesita `pip install fonttools brotli`). Los iconos que define el
backend están guardados en `scripts/iconos-del-backend.txt`.

## Diseño

Paleta azul y verde («GuíaU Rural»), contrastes medidos, tipografía y movimiento en [DESIGN.md](DESIGN.md). El estado
de cada dato nunca depende solo del color: lleva forma y texto. La animación se desactiva con «reducir movimiento».

## Panel de administración

La ruta `/admin` (no aparece en el menú) trae el panel: editar datos, imágenes y videos, portada, **Qué revisar hoy**
(el Detective) e **Importar propuesta** (datos sugeridos por IA con cita de la fuente, que una persona revisa y
aprueba). La contraseña y la lógica están en el backend.

## Límites de la versión 1

- **Los datos son de ejemplo.** Falta cargar y verificar los reales.
- **La primera visita necesita conexión** (~250 KB). Después todo funciona sin señal.
- **Costos:** son una estimación con los costos publicados.
- **«Cómo llegar»** abre el mapa del teléfono; no se incrusta un mapa (pesaría con señal débil).
- **«Cerca de mí»** usa el GPS solo en el teléfono y necesita que cada preuniversitario tenga latitud y longitud.
- **No se probó** en un teléfono real ni con red lenta simulada.
- **Solo español.**
- El test orienta, **no diagnostica**; así lo dice la propia página.
