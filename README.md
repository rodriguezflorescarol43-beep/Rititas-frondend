# Despega · Frontend (PWA)

**Abstracthon 2026.** «Despega» (guía de ingreso a la universidad) es una página web para quienes terminan el colegio en zonas alejadas (provincias) y no saben **qué
estudiar**, **qué preuniversitarios existen** ni **cuándo son las convocatorias**. Pensada para **señal débil**, sin
registro y que funciona **sin señal**.

Este repositorio es el **frontend**: la página que ve el estudiante (y la pantalla del panel de administración). La API
y la base de datos están en el repositorio del backend.

| Parte | Repositorio |
|---|---|
| **Frontend** (este) | https://github.com/rodriguezflorescarol43-beep/Rititas-frondend |
| **Backend** (API y panel) | https://github.com/rodriguezflorescarol43-beep/Rititas-backend |

## El problema y la solución

**Problema.** Quien sale del colegio en una provincia suele no saber qué estudiar, no conoce los preuniversitarios
(institutos) ni las fechas de ingreso, que están dispersas en PDFs de cada universidad, y además tiene señal débil
o intermitente.

**Solución.** Una guía web instalable (PWA) que reúne todo en un solo lugar y funciona con poca señal.

> **Alcance actual: solo Cochabamba.** Es una versión de prueba con datos reales de la UMSS, UCB, UPB y Univalle y
> cuatro preuniversitarios. Lo que las fuentes no publican (por ejemplo, costos) **no se inventa ni se muestra**.

**Menú:** Inicio · Preuniversitario (institutos) · Universidades · ¿No sabes qué estudiar? · Contacto.
Las convocatorias están **dentro de cada universidad**: Universidades → una universidad → una facultad.

## Qué hace

| Sección | Contenido |
|---|---|
| **Inicio** | La ruta paso a paso: descubrir qué estudiar, universidades, prepararte y convocatorias |
| **Preuniversitario (institutos)** | Elegir la **facultad** → lista con filtros (Presencial, Virtual, **Cerca de mí**) → detalle con zona, materias, «Cómo llegar» y un bloque de **contacto y redes** (teléfono, WhatsApp, Instagram, Facebook, TikTok: solo los que existen) |
| **Universidades** | Públicas y privadas, cada una con una **descripción corta** y sus canales de contacto. Al entrar a una universidad se ven sus **facultades**; al entrar a una facultad se ven sus **carreras** y su **convocatoria** (fechas, requisitos, imagen del afiche y botón para guardar las fechas en el calendario) |
| **¿No sabes qué estudiar?** | Test de 8 preguntas → **Plan A, B y C** con el motivo explicado y carreras que te pueden interesar. El Plan C lleva a los **preuniversitarios de la facultad que salió como prioridad** |
| **Usar sin señal** | Estado de los datos guardados y modo ahorro de datos |
| **Contacto** | Formulario; si no hay señal, el mensaje se guarda y se envía solo al volver |
| **Escuchar** | Lee la pantalla en voz alta con la voz del teléfono (necesita una voz en español instalada) |

Cada dato muestra su **fuente** y su **fecha de verificación** cuando existen. Si todavía no se confirmó, la página
lo dice («Tomado de la fuente · falta confirmar»).

## Pensada para señal débil (no solo «sin internet»)

Con poca señal hay tres problemas: el **peso** de la primera visita, la **latencia** de cada petición y los **cortes**.

| Problema | Qué hace la página | Dónde |
|---|---|---|
| Peso | Fuentes solo en letras latinas, **iconos recortados a los 96 que se usan (14 KB en vez de 528 KB)**, compresión en el servidor | `src/main.js`, `scripts/subset_iconos.py` |
| Latencia | Descarga **un solo archivo** con todo el catálogo (~31 KB) y lo guarda en el teléfono. Las pantallas se llenan sin pedir nada por la red | `src/datos/` |
| Cortes | Si los datos no cambiaron, el servidor responde 304 sin cuerpo. Los mensajes escritos sin señal se guardan y se envían solos | `src/utils/cola.js` |
| Datos viejos | El estado de las convocatorias se calcula **en el teléfono** con la fecha de hoy, aunque los datos se hayan guardado hace días | `src/datos/estado.js` |
| Datos pesados | **Modo ahorro** (automático o manual): no carga fotos; el video de la portada no se reproduce solo | `src/composables/useAhorro.js` |

**Medido en esta versión** (compilación de producción, **sin** red lenta simulada):

| | Antes | Ahora |
|---|---|---|
| Archivos guardados en la primera visita | 91 | **40** |
| Peso sin comprimir | 1.400 KB | **313 KB** |
| Fuentes | 51 archivos, 804 KB | **5 archivos, 77 KB** |
| Catálogo completo | varias peticiones | **1 archivo de ~31 KB** |

El panel de administración **no se guarda de antemano** en el teléfono del estudiante: así la preparación para usar
sin señal termina antes.

> Son cifras de la compilación, no de un celular real con red lenta. Mídelas con Lighthouse en «Slow 4G» antes de
> presentarlas como logro.

### El test corre en el teléfono
El motor de orientación (`src/datos/motor.js`) calcula **en el teléfono**, así que funciona sin señal y las respuestas
no se envían a ningún servidor. Una prueba automática del repositorio del backend comprueba que da **exactamente lo
mismo** que el del servidor.

### Paquete de datos firmado
Los datos viajan en un paquete **firmado (ECDSA P-256)** y la página comprueba el sello con Web Crypto: rechaza lo
alterado y lo más viejo que lo que ya tiene. Requiere **HTTPS** (o `localhost`). La pantalla para **pasar los datos por
WhatsApp** se quitó por ahora; el código de verificación sigue en `src/datos/` por si se vuelve a usar.

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
#    https://github.com/rodriguezflorescarol43-beep/Rititas-backend
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

La ruta `/admin` (no aparece en el menú) trae el panel. La contraseña y la lógica están en el backend.

- **Datos:** universidades (con descripción, teléfono y redes), facultades (con la imagen de su convocatoria), carreras,
  convocatorias y preuniversitarios; **imágenes y videos** y la **portada**.
- **Qué revisar hoy:** el Detective de datos (reglas y estadística, sin IA).
- **Importar con IA:** en tres pasos. **«Leer con IA»** (Gemini) lee un PDF o una foto y propone los datos con la frase
  donde los leyó; la página **comprueba cada frase** contra el documento (semáforo 🟢🟡🔴) y una persona aprueba antes de
  publicar. Hay un **documento de ejemplo** que funciona sin internet y no se puede publicar, y la alternativa manual con Claude.
- **Medir la IA:** marcando cada dato, calcula cuánto acierta, cuánto inventa y cuántos errores atrapa el verificador,
  frente a un método sin IA.

**La IA es solo para el administrador:** los estudiantes nunca la usan. El detalle (clave de Gemini, privacidad y
seguridad) está en el README del backend.

## Límites de la versión 1

- **Solo Cochabamba.** Los datos son reales pero **faltan por confirmar** y no hay costos mensuales ni fechas 2027 de la
  mayoría de universidades; por eso la página no muestra costos.
- **La primera visita necesita conexión** (~313 KB). Después todo funciona sin señal.
- **Fotos:** las universidades, los preuniversitarios y los afiches de convocatoria muestran su foto solo cuando el
  administrador la sube; mientras tanto se ve un cuadro gris.
- **«Cómo llegar»** abre el mapa del teléfono; no se incrusta un mapa (pesaría con señal débil).
- **«Cerca de mí»** usa el GPS solo en el teléfono y necesita que cada preuniversitario tenga latitud y longitud.
- **No se probó** en un teléfono real ni con red lenta simulada.
- **Solo español.**
- El test orienta, **no diagnostica**; así lo dice la propia página.

